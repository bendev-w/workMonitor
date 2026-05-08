import { Order, ordersService } from "./ordersService";
import { settingsService } from "./settingsService";

/**
 * Scheduling Service - Core algorithm for calculating order timelines
 * Determines when orders will start and complete based on workload and user availability
 *
 * Key Concepts:
 * - Start Date: When user will be FREE to start a new order (after current workload)
 * - Estimated Completion: When the order will FINISH based on daily work hours
 * - Deadline: Customer's requested completion date
 * - Status: on-time, at-risk, or overdue
 */
export const schedulingService = {
  /**
   * CORE ALGORITHM - Calculate realistic start date for a new order
   *
   * Logic:
   * 1. Get all active (non-completed) orders
   * 2. Sum their total hours
   * 3. Divide by hours_per_day to get working days needed
   * 4. Count forward only working days (skip non-working days)
   * 5. Return the date when user will be free
   */
  async calculateStartDate(userId: string, considerDeadline = true): Promise<{ startDate: Date; reason: string }> {
    const settings = await settingsService.getUserSettings(userId);
    const activeOrders = await ordersService.getActiveOrders(userId);

    if (activeOrders.length === 0) {
      // No active work - can start immediately
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        startDate: tomorrow,
        reason: "No active orders - can start immediately",
      };
    }

    // Calculate total hours of current work
    let accumulatedHours = 0;

    for (const order of activeOrders) {
      if (order.status === "completed" || order.status === "cancelled") continue;

      accumulatedHours += order.estimated_total_hours || 0;
    }

    // Calculate how many working days needed for all current work
    const workingDaysNeeded = Math.ceil(accumulatedHours / settings.hours_per_day);

    // Calculate actual completion date considering only working days
    let freeDate = new Date();
    freeDate.setHours(0, 0, 0, 0);
    let daysAdded = 0;
    const workdayNumbers = settings.workdays.split(",").map(Number);

    while (daysAdded < workingDaysNeeded) {
      freeDate.setDate(freeDate.getDate() + 1);
      const dayOfWeek = freeDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (workdayNumbers.includes(adjustedDay)) {
        daysAdded++;
      }
    }

    return {
      startDate: freeDate,
      reason: `Will be free after ${workingDaysNeeded} working days (${Math.round(accumulatedHours)} hours of current work)`,
    };
  },

  /**
   * CORE ALGORITHM - Calculate estimated completion date
   * 
   * Inputs:
   * - estimatedHours: Total hours needed for this order (quantity × hours_per_item)
   * - startDate: When work will begin
   * - workHoursPerDay: From user settings
   * - workingDays: From user settings
   * 
   * Logic:
   * 1. Divide estimated hours by daily work hours
   * 2. Count actual working days (skip weekends/non-working days)
   * 3. Return the calculated completion date
   */
  async calculateCompletionDate(userId: string, estimatedHours: number, startDate?: Date): Promise<Date> {
    const settings = await settingsService.getUserSettings(userId);
    const workdayNumbers = settings.workdays.split(",").map(Number);

    const start = startDate || new Date();
    start.setHours(0, 0, 0, 0); // Start at beginning of day

    let hoursRemaining = estimatedHours;
    let currentDate = new Date(start);
    let daysWorked = 0;

    // Move to next working day if starting on non-working day
    while (true) {
      const dayOfWeek = currentDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (workdayNumbers.includes(adjustedDay)) {
        break;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count working days needed
    while (hoursRemaining > 0) {
      const dayOfWeek = currentDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (workdayNumbers.includes(adjustedDay)) {
        hoursRemaining -= settings.hours_per_day;
        daysWorked++;
      }

      if (hoursRemaining > 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return currentDate;
  },

  /**
   * MAIN SCHEDULING FUNCTION - Calculate complete schedule for an order
   *
   * This combines:
   * 1. Calculate when user will be free (startDate)
   * 2. Calculate when order will be done (completionDate)
   * 3. Compare against customer deadline
   * 4. Flag if deadline will be missed
   *
   * Returns schedule analysis with deadline risk assessment
   */
  async scheduleOrder(userId: string, orderData: { estimated_total_hours: number; deadline?: number }): Promise<{
    startDate: Date;
    estimatedCompletionDate: Date;
    deadline?: Date;
    canMeetDeadline: boolean;
    daysUntilCompletion: number;
    daysUntilDeadline?: number;
    status: "on-time" | "at-risk" | "overdue";
    warningMessage?: string;
  }> {
    // Step 1: Calculate when user will be free
    const { startDate, reason } = await schedulingService.calculateStartDate(userId);

    // Step 2: Calculate completion date from start date
    const completionDate = await schedulingService.calculateCompletionDate(userId, orderData.estimated_total_hours, startDate);

    // Step 3: Check against deadline
    const deadline = orderData.deadline ? new Date(orderData.deadline) : null;
    const canMeetDeadline = !deadline || completionDate <= deadline;

    const now = new Date();
    const daysUntilCompletion = Math.ceil((completionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilDeadline = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

    let status: "on-time" | "at-risk" | "overdue" = "on-time";
    let warningMessage: string | undefined;

    if (!deadline) {
      status = "on-time";
    } else if (completionDate > deadline) {
      const daysLate = Math.ceil((completionDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
      status = "overdue";
      warningMessage = `⚠️ This order will be ${daysLate} days LATE if started today`;
    } else {
      const daysMargin = Math.ceil((deadline.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysMargin <= 1) {
        status = "at-risk";
        warningMessage = `⚠️ Tight deadline - only ${daysMargin} day margin`;
      } else {
        status = "on-time";
      }
    }

    return {
      startDate,
      estimatedCompletionDate: completionDate,
      deadline: deadline || undefined,
      canMeetDeadline,
      daysUntilCompletion,
      daysUntilDeadline,
      status,
      warningMessage,
    };
  },

  /**
   * WORKLOAD ANALYSIS - Check if current workload is sustainable
   */
  async analyzeWorkload(userId: string): Promise<{
    totalPendingHours: number;
    totalInProgressHours: number;
    totalHours: number;
    estimatedCompletionDate: Date;
    averageDaysPerOrder: number;
    isOverloaded: boolean;
    daysOfWork: number;
    recommendation: string;
  }> {
    const settings = await settingsService.getUserSettings(userId);
    const orders = await ordersService.getUserOrders(userId);

    const pendingHours = orders.filter((o: any) => o.status === "pending").reduce((sum: number, o: any) => sum + (o.estimated_total_hours || 0), 0);
    const inProgressHours = orders.filter((o: any) => o.status === "in-progress").reduce((sum: number, o: any) => sum + (o.estimated_total_hours || 0), 0);

    const totalHours = pendingHours + inProgressHours;
    const workingDaysPerWeek = settings.workdays.split(",").length;
    const hoursPerWeek = settings.hours_per_day * workingDaysPerWeek;

    const daysOfWork = Math.ceil(totalHours / settings.hours_per_day);
    const weeksOfWork = daysOfWork / workingDaysPerWeek;

    // Calculate completion date
    const completionDate = new Date();
    let daysAdded = 0;
    const workdayNumbers = settings.workdays.split(",").map(Number);

    while (daysAdded < daysOfWork) {
      completionDate.setDate(completionDate.getDate() + 1);
      const dayOfWeek = completionDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (workdayNumbers.includes(adjustedDay)) {
        daysAdded++;
      }
    }

    // Determine if overloaded (more than 8 weeks of work)
    const isOverloaded = weeksOfWork > 8;

    const avgDaysPerOrder = orders.length > 0 ? daysOfWork / orders.length : 0;

    let recommendation = "✅ Workload is sustainable";
    if (isOverloaded) {
      recommendation = `⚠️ Heavy workload: ${Math.round(weeksOfWork)} weeks of work. Consider raising hourly rate or expanding team.`;
    } else if (weeksOfWork > 4) {
      recommendation = `📊 Moderate workload: ${Math.round(weeksOfWork)} weeks. Keep an eye on capacity.`;
    }

    return {
      totalPendingHours: pendingHours,
      totalInProgressHours: inProgressHours,
      totalHours,
      estimatedCompletionDate: completionDate,
      averageDaysPerOrder: avgDaysPerOrder,
      isOverloaded,
      daysOfWork,
      recommendation,
    };
  },

  /**
   * DEADLINE ANALYSIS - Which orders are at risk?
   * Categorizes orders by deadline status and identifies urgent items
   */
  async analyzeDeadlines(userId: string): Promise<{
    onTime: Order[];
    atRisk: Order[];
    overdue: Order[];
    summary: {
      totalOrders: number;
      onTimeCount: number;
      atRiskCount: number;
      overdueCount: number;
      nextUrgentDeadline?: { order: Order; daysRemaining: number };
    };
  }> {
    const orders = await ordersService.getUserOrders(userId);
    const now = new Date().getTime();

    const onTime: Order[] = [];
    const atRisk: Order[] = [];
    const overdue: Order[] = [];

    for (const order of orders) {
      if (order.status === "completed" || order.status === "cancelled" || !order.deadline) {
        continue;
      }

      const daysRemaining = (order.deadline - now) / (1000 * 60 * 60 * 24);

      if (daysRemaining < 0) {
        overdue.push(order);
      } else if (daysRemaining <= 3) {
        atRisk.push(order);
      } else {
        onTime.push(order);
      }
    }

    // Find next urgent deadline
    const urgentOrders = [...atRisk, ...overdue].sort((a, b) => (a.deadline || 0) - (b.deadline || 0));
    const nextUrgent = urgentOrders[0];

    return {
      onTime,
      atRisk,
      overdue,
      summary: {
        totalOrders: orders.filter((o: any) => o.status !== "completed" && o.status !== "cancelled").length,
        onTimeCount: onTime.length,
        atRiskCount: atRisk.length,
        overdueCount: overdue.length,
        nextUrgentDeadline: nextUrgent && nextUrgent.deadline
          ? {
              order: nextUrgent,
              daysRemaining: Math.ceil((nextUrgent.deadline - now) / (1000 * 60 * 60 * 24)),
            }
          : undefined,
      },
    };
  },

  /**
   * RECALCULATE ALL - Rebuild schedule for all orders after settings change
   */
  async recalculateAllSchedules(userId: string): Promise<void> {
    const orders = await ordersService.getUserOrders(userId);

    for (const order of orders) {
      if (order.status === "completed" || order.status === "cancelled") continue;

      const schedule = await schedulingService.scheduleOrder(userId, {
        estimated_total_hours: order.estimated_total_hours,
        deadline: order.deadline,
      });

      await ordersService.updateOrder(order.id, {
        deadline: schedule.deadline?.getTime(),
      });
    }
  },
};

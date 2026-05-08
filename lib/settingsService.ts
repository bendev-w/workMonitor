import { db } from "./database";
import { ordersService } from "./ordersService";

/**
 * User Settings type definition
 */
export type UserSettings = {
  id: number;
  user_id: string;
  hours_per_day: number;
  workdays: string; // CSV format: "1,2,3,4,5" (1=Monday, 7=Sunday)
  reminder_frequency: string;
  theme: "light" | "dark";
  notifications_enabled: boolean;
  auto_track_enabled: boolean;
  break_interval: number; // in minutes
  break_duration: number; // in minutes
  created_at: number;
  updated_at: number;
};

export type UpdateSettingsInput = Partial<Omit<UserSettings, "id" | "user_id" | "created_at" | "updated_at">>;

/**
 * Settings Service - Handles user preferences and configuration
 * Includes smart recalculation of order timelines when settings change
 */
export const settingsService = {
  /**
   * READ - Get user settings (creates defaults if not exists)
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    const settings = await db.getUserSettings(userId);
    return settings as UserSettings;
  },

  /**
   * UPDATE - Update user settings with smart recalculation
   * When critical settings change (hours_per_day, workdays), recalculate order timelines
   */
  async updateUserSettings(userId: string, updates: UpdateSettingsInput): Promise<void> {
    const oldSettings = await db.getUserSettings(userId);

    // Check if critical settings changed
    const criticalSettingsChanged = updates.hours_per_day !== undefined || updates.workdays !== undefined;

    // Update the settings
    await db.updateUserSettings(userId, updates);

    // If critical settings changed, recalculate all order timelines
    if (criticalSettingsChanged) {
      await settingsService.recalculateOrderTimelines(userId);
    }
  },

  /**
   * UPDATE - Set hours per day (critical setting that affects scheduling)
   */
  async setHoursPerDay(userId: string, hours: number): Promise<void> {
    if (hours <= 0) throw new Error("Hours per day must be greater than 0");
    await settingsService.updateUserSettings(userId, { hours_per_day: hours });
  },

  /**
   * UPDATE - Set working days
   * @param workdays Array of day numbers (1=Monday, 7=Sunday)
   */
  async setWorkingDays(userId: string, workdays: number[]): Promise<void> {
    if (workdays.length === 0) throw new Error("At least one working day must be selected");
    const validDays = workdays.every((d) => d >= 1 && d <= 7);
    if (!validDays) throw new Error("Day numbers must be between 1-7");

    const workdaysString = workdays.sort((a, b) => a - b).join(",");
    await settingsService.updateUserSettings(userId, { workdays: workdaysString });
  },

  /**
   * UPDATE - Set theme preference
   */
  async setTheme(userId: string, theme: "light" | "dark"): Promise<void> {
    await db.updateUserSettings(userId, { theme });
  },

  /**
   * UPDATE - Toggle notifications
   */
  async setNotificationsEnabled(userId: string, enabled: boolean): Promise<void> {
    await db.updateUserSettings(userId, { notifications_enabled: enabled ? 1 : 0 });
  },

  /**
   * UPDATE - Toggle auto-tracking
   */
  async setAutoTrackEnabled(userId: string, enabled: boolean): Promise<void> {
    await db.updateUserSettings(userId, { auto_track_enabled: enabled ? 1 : 0 });
  },

  /**
   * UPDATE - Set Pomodoro timer settings
   */
  async setPomodoro(userId: string, workInterval: number, breakDuration: number): Promise<void> {
    if (workInterval <= 0 || breakDuration <= 0) throw new Error("Intervals must be greater than 0");
    await db.updateUserSettings(userId, { break_interval: workInterval, break_duration: breakDuration });
  },

  /**
   * UPDATE - Set reminder frequency
   */
  async setReminderFrequency(userId: string, frequency: "daily" | "weekly" | "never"): Promise<void> {
    await db.updateUserSettings(userId, { reminder_frequency: frequency });
  },

  /**
   * CALCULATION - Calculate working hours between two dates
   * Takes into account hours_per_day and working days only
   */
  async calculateWorkingHours(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const settings = await settingsService.getUserSettings(userId);
    const workdayNumbers = settings.workdays.split(",").map(Number);

    let totalHours = 0;
    const current = new Date(startDate);

    while (current < endDate) {
      const dayOfWeek = current.getDay(); // 0=Sunday, 1=Monday...6=Saturday
      // Convert to 1=Monday...7=Sunday format
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (workdayNumbers.includes(adjustedDay)) {
        totalHours += settings.hours_per_day;
      }

      current.setDate(current.getDate() + 1);
    }

    return totalHours;
  },

  /**
   * CALCULATION - Calculate estimated completion date for an order
   * Based on estimated hours and user's working schedule
   */
  async calculateCompletionDate(userId: string, estimatedHours: number, startDate?: Date): Promise<Date> {
    const settings = await settingsService.getUserSettings(userId);
    const workdayNumbers = settings.workdays.split(",").map(Number);

    const start = startDate || new Date();
    const hoursPerDay = settings.hours_per_day;

    let hoursRemaining = estimatedHours;
    const current = new Date(start);

    while (hoursRemaining > 0) {
      const dayOfWeek = current.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (workdayNumbers.includes(adjustedDay)) {
        hoursRemaining -= hoursPerDay;
      }

      if (hoursRemaining > 0) {
        current.setDate(current.getDate() + 1);
      }
    }

    return current;
  },

  /**
   * SMART RECALCULATION - Recalculate all order timelines
   * Called automatically when hours_per_day or workdays change
   */
  async recalculateOrderTimelines(userId: string): Promise<void> {
    const orders = await ordersService.getUserOrders(userId);

    for (const order of orders) {
      // Skip completed or cancelled orders
      if (order.status === "completed" || order.status === "cancelled") continue;

      // Recalculate completion date based on current settings
      const startDate = order.start_date ? new Date(order.start_date) : new Date();
      const estimatedHours = order.estimated_total_hours || 0;

      const newCompletionDate = await settingsService.calculateCompletionDate(userId, estimatedHours, startDate);

      // Update order if completion date changed
      await ordersService.updateOrder(order.id, {
        deadline: newCompletionDate.getTime(),
      });
    }
  },

  /**
   * STATS - Get suggested hours per day based on orders
   * Analyzes all orders and suggests realistic hours per day
   */
  async suggestHoursPerDay(userId: string): Promise<number> {
    const stats = await ordersService.getOrderStats(userId);
    const settings = await settingsService.getUserSettings(userId);

    if (!stats.total_orders || stats.total_orders === 0) return settings.hours_per_day;

    // Calculate average hours per order
    const avgHours = stats.total_hours / stats.total_orders;

    // Suggest minimum 5 hours/day, maximum 12 hours/day
    const suggested = Math.max(5, Math.min(12, Math.ceil(avgHours)));
    return suggested;
  },

  /**
   * STATS - Get workday settings as readable format
   */
  getWorkdaysReadable(workdaysString: string): string {
    const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const workdays = workdaysString.split(",").map(Number);
    return workdays.map((d) => dayNames[d]).join(", ");
  },

  /**
   * VALIDATION - Validate all settings
   */
  async validateSettings(userId: string, updates: UpdateSettingsInput): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (updates.hours_per_day !== undefined) {
      if (updates.hours_per_day <= 0 || updates.hours_per_day > 24) {
        errors.push("Hours per day must be between 1-24");
      }
    }

    if (updates.workdays !== undefined) {
      const days = updates.workdays.split(",").map(Number);
      if (days.length === 0) {
        errors.push("At least one working day must be selected");
      }
      if (!days.every((d) => d >= 1 && d <= 7)) {
        errors.push("Invalid working day numbers");
      }
    }

    if (updates.break_interval !== undefined && updates.break_interval <= 0) {
      errors.push("Break interval must be greater than 0");
    }

    if (updates.break_duration !== undefined && updates.break_duration <= 0) {
      errors.push("Break duration must be greater than 0");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

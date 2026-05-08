import { useAuth } from "../context/AuthContext";
import { schedulingService } from "./schedulingService";

/**
 * React hook for scheduling operations
 * Automatically scopes all operations to the logged-in user
 */
export const useScheduling = () => {
  const { user } = useAuth();

  if (!user) {
    throw new Error("useScheduling must be used within AuthProvider");
  }

  return {
    /**
     * Calculate when a new order will start based on current workload
     */
    calculateStartDate: () => schedulingService.calculateStartDate(user.id),

    /**
     * Calculate when an order will be completed
     */
    calculateCompletionDate: (estimatedHours: number, startDate?: Date) =>
      schedulingService.calculateCompletionDate(user.id, estimatedHours, startDate),

    /**
     * Get full schedule for an order (start + completion + deadline analysis)
     */
    scheduleOrder: (orderData: { estimated_total_hours: number; deadline?: number }) =>
      schedulingService.scheduleOrder(user.id, orderData),

    /**
     * Analyze if current workload is sustainable
     */
    analyzeWorkload: () => schedulingService.analyzeWorkload(user.id),

    /**
     * Check which orders are at risk or overdue
     */
    analyzeDeadlines: () => schedulingService.analyzeDeadlines(user.id),

    /**
     * Recalculate all orders after settings change
     */
    recalculateAllSchedules: () => schedulingService.recalculateAllSchedules(user.id),
  };
};

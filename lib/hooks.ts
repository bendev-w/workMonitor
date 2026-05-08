import { useAuth } from "../context/AuthContext";
import { db } from "./database";

export function useDatabase() {
  const { user } = useAuth();

  if (!user) {
    throw new Error("useDatabase must be used within an authenticated context");
  }

  return {
    // Work Sessions
    startWorkSession: (notes?: string) => db.addWorkSession(user.id, Date.now(), notes),
    endWorkSession: (sessionId: number) => db.endWorkSession(sessionId),
    getActiveSessions: () => db.getActiveSessions(user.id),
    getUserSessions: (limit?: number) => db.getUserSessions(user.id, limit),

    // Tasks
    addTask: (name: string, description?: string, category?: string) => db.addTask(user.id, name, description, category),
    completeTask: (taskId: number) => db.completeTask(taskId),
    getUserTasks: (status?: string) => db.getUserTasks(user.id, status),

    // Daily Stats
    updateDailyStats: (date: string, stats: { total_hours?: number; tasks_completed?: number; focus_time?: number; break_time?: number }) => db.updateDailyStats(user.id, date, stats),
    getDailyStats: (date: string) => db.getDailyStats(user.id, date),
    getUserStatsRange: (startDate: string, endDate: string) => db.getUserStatsRange(user.id, startDate, endDate),

    // Settings
    setSetting: (key: string, value: string) => db.setSetting(user.id, key, value),
    getSetting: (key: string) => db.getSetting(user.id, key),

    // Orders
    createOrder: (order: { product_name: string; product_description?: string; quantity: number; hours_per_item?: number; start_date?: number; deadline?: number; notes?: string; color?: string; size?: string; material?: string; priority?: string }) => db.createOrder(user.id, order),
    updateOrder: (orderId: number, updates: Record<string, any>) => db.updateOrder(orderId, updates),
    getOrder: (orderId: number) => db.getOrder(orderId),
    getUserOrders: (status?: string) => db.getUserOrders(user.id, status),
    deleteOrder: (orderId: number) => db.deleteOrder(orderId),
    getOrderStats: () => db.getOrderStats(user.id),

    // User Settings
    initializeUserSettings: () => db.initializeUserSettings(user.id),
    getUserSettings: () => db.getUserSettings(user.id),
    updateUserSettings: (updates: Record<string, any>) => db.updateUserSettings(user.id, updates),
  };
}

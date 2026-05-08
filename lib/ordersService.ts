import { db } from "./database";

/**
 * Order type definition
 */
export type Order = {
  id: number;
  user_id: string;
  product_name: string;
  product_description?: string;
  quantity: number;
  hours_per_item?: number;
  estimated_total_hours: number;
  start_date?: number;
  deadline?: number;
  completion_date?: number;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  payment_status: "unpaid" | "paid" | "partial";
  notes?: string;
  color?: string;
  size?: string;
  material?: string;
  priority: "low" | "medium" | "high";
  created_at: number;
  updated_at: number;
};

export type CreateOrderInput = {
  product_name: string;
  product_description?: string;
  quantity: number;
  hours_per_item?: number;
  start_date?: number;
  deadline?: number;
  notes?: string;
  color?: string;
  size?: string;
  material?: string;
  priority?: "low" | "medium" | "high";
};

/**
 * Orders Service - Handles all order-related database operations
 */
export const ordersService = {
  /**
   * CREATE - Add a new order
   * @param userId - The user who is creating the order
   * @param orderData - Order details
   * @returns Order ID of the newly created order
   */
  async createOrder(userId: string, orderData: CreateOrderInput): Promise<number> {
    return await db.createOrder(userId, orderData);
  },

  /**
   * READ - Get a single order by ID
   * @param orderId - The order to retrieve
   * @returns Order object or undefined if not found
   */
  async getOrderById(orderId: number): Promise<Order | null> {
    const order = await db.getOrder(orderId);
    return (order as Order) || null;
  },

  /**
   * READ - Get all orders for a user
   * @param userId - The user whose orders to retrieve
   * @param filters - Optional filters (status, priority, etc.)
   * @returns Array of orders
   */
  async getUserOrders(userId: string, filters?: { status?: string; priority?: string; sortBy?: "deadline" | "created" | "priority" }): Promise<Order[]> {
    let orders = await db.getUserOrders(userId, filters?.status);

    // Apply additional filters if provided
    if (filters?.priority) {
      orders = orders.filter((order: any) => order.priority === filters.priority);
    }

    // Sort results
    if (filters?.sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      orders.sort((a: any, b: any) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
    }

    return orders as Order[];
  },

  /**
   * READ - Get active orders (pending or in-progress)
   */
  async getActiveOrders(userId: string): Promise<Order[]> {
    const pending = await db.getUserOrders(userId, "pending");
    const inProgress = await db.getUserOrders(userId, "in-progress");
    return [...(pending || []), ...(inProgress || [])] as Order[];
  },

  /**
   * READ - Get completed orders
   */
  async getCompletedOrders(userId: string): Promise<Order[]> {
    return (await db.getUserOrders(userId, "completed")) as Order[];
  },

  /**
   * READ - Get overdue orders (deadline passed, not completed)
   */
  async getOverdueOrders(userId: string): Promise<Order[]> {
    const now = Date.now();
    const orders = await db.getUserOrders(userId);
    return (orders as Order[]).filter((order) => order.deadline && order.deadline < now && order.status !== "completed");
  },

  /**
   * UPDATE - Modify order details
   * @param orderId - Order to update
   * @param updates - Fields to update
   */
  async updateOrder(orderId: number, updates: Partial<Omit<Order, "id" | "user_id" | "created_at">>): Promise<void> {
    await db.updateOrder(orderId, updates);
  },

  /**
   * UPDATE - Mark order as in-progress
   */
  async startOrder(orderId: number): Promise<void> {
    await db.updateOrder(orderId, { status: "in-progress", start_date: Date.now() });
  },

  /**
   * UPDATE - Mark order as completed
   */
  async completeOrder(orderId: number): Promise<void> {
    await db.updateOrder(orderId, { status: "completed", completion_date: Date.now() });
  },

  /**
   * UPDATE - Mark order as cancelled
   */
  async cancelOrder(orderId: number): Promise<void> {
    await db.updateOrder(orderId, { status: "cancelled" });
  },

  /**
   * UPDATE - Update payment status
   */
  async updatePaymentStatus(orderId: number, status: "unpaid" | "paid" | "partial"): Promise<void> {
    await db.updateOrder(orderId, { payment_status: status });
  },

  /**
   * UPDATE - Update order quantity and recalculate hours
   */
  async updateQuantity(orderId: number, newQuantity: number): Promise<void> {
    const order = (await db.getOrder(orderId)) as Order;
    if (!order) throw new Error("Order not found");

    const estimatedHours = (order.hours_per_item || 0) * newQuantity;
    await db.updateOrder(orderId, { quantity: newQuantity, estimated_total_hours: estimatedHours });
  },

  /**
   * DELETE - Remove an order
   * @param orderId - Order to delete
   */
  async deleteOrder(orderId: number): Promise<void> {
    await db.deleteOrder(orderId);
  },

  /**
   * STATS - Get order statistics
   */
  async getOrderStats(userId: string) {
    return await db.getOrderStats(userId);
  },

  /**
   * STATS - Calculate total hours for user's orders
   */
  async getTotalHours(userId: string): Promise<number> {
    const stats = await db.getOrderStats(userId);
    return stats?.total_hours || 0;
  },

  /**
   * STATS - Get completion percentage
   */
  async getCompletionPercentage(userId: string): Promise<number> {
    const stats = await db.getOrderStats(userId);
    if (!stats?.total_orders || stats.total_orders === 0) return 0;
    return Math.round((stats.completed / stats.total_orders) * 100);
  },

  /**
   * STATS - Get upcoming deadlines (next 7 days)
   */
  async getUpcomingDeadlines(userId: string): Promise<Order[]> {
    const now = Date.now();
    const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const orders = await db.getUserOrders(userId);
    return (orders as Order[]).filter((order) => order.deadline && order.deadline > now && order.deadline <= weekFromNow && order.status !== "completed").sort((a, b) => (a.deadline || 0) - (b.deadline || 0));
  },
};

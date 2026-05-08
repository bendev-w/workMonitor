import { useAuth } from "../context/AuthContext";
import { CreateOrderInput, Order, ordersService } from "./ordersService";

/**
 * Hook to manage orders in components
 * Automatically scopes all operations to the logged-in user
 */
export function useOrders() {
  const { user } = useAuth();

  if (!user) {
    throw new Error("useOrders must be used within an authenticated context");
  }

  return {
    // Create
    createOrder: (orderData: CreateOrderInput) => ordersService.createOrder(user.id, orderData),

    // Read - Single & Multiple
    getOrderById: (orderId: number) => ordersService.getOrderById(orderId),
    getUserOrders: (filters?: { status?: string; priority?: string; sortBy?: "deadline" | "created" | "priority" }) => ordersService.getUserOrders(user.id, filters),
    getActiveOrders: () => ordersService.getActiveOrders(user.id),
    getCompletedOrders: () => ordersService.getCompletedOrders(user.id),
    getOverdueOrders: () => ordersService.getOverdueOrders(user.id),
    getUpcomingDeadlines: () => ordersService.getUpcomingDeadlines(user.id),

    // Update
    updateOrder: (orderId: number, updates: Partial<Omit<Order, "id" | "user_id" | "created_at">>) => ordersService.updateOrder(orderId, updates),
    startOrder: (orderId: number) => ordersService.startOrder(orderId),
    completeOrder: (orderId: number) => ordersService.completeOrder(orderId),
    cancelOrder: (orderId: number) => ordersService.cancelOrder(orderId),
    updatePaymentStatus: (orderId: number, status: "unpaid" | "paid" | "partial") => ordersService.updatePaymentStatus(orderId, status),
    updateQuantity: (orderId: number, newQuantity: number) => ordersService.updateQuantity(orderId, newQuantity),

    // Delete
    deleteOrder: (orderId: number) => ordersService.deleteOrder(orderId),

    // Stats
    getOrderStats: () => ordersService.getOrderStats(user.id),
    getTotalHours: () => ordersService.getTotalHours(user.id),
    getCompletionPercentage: () => ordersService.getCompletionPercentage(user.id),
  };
}

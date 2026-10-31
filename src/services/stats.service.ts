import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { startOfMonthEC, startOfTodayEC } from "../utils/businessTime";

export async function stats() {
  const today = startOfTodayEC();
  const month = startOfMonthEC();

  const [products, activeProducts, ordersToday, pendingOrders, revenue] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ status: "pending" }),
    // Ingreso del mes: todo lo que no se canceló.
    Order.aggregate<{ total: number }>([
      { $match: { createdAt: { $gte: month }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalCents" } } },
    ]),
  ]);

  return {
    products,
    activeProducts,
    ordersToday,
    pendingOrders,
    revenueMonthCents: revenue[0]?.total ?? 0,
  };
}

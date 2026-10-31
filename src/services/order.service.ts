import { FilterQuery, Types } from "mongoose";
import { BRANCHES, STORE_WHATSAPP } from "../config/business";
import { CustomError } from "../errors/customError.error";
import { IOrder, IOrderItem, ORDER_STATUSES, Order, OrderStatus } from "../models/order.model";
import { Product } from "../models/product.model";
import { generateOrderCode } from "../utils/orderCode";
import { normalizeEcPhone } from "../utils/phone";
import { escapeRegex, formatUSD } from "../utils/text";

const MAX_LINES = 30;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: unknown, max = 200): string {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

export async function create(body: any) {
  const rawItems = Array.isArray(body?.items) ? body.items : [];
  if (!rawItems.length) throw new CustomError("Tu pedido está vacío", 400);
  if (rawItems.length > MAX_LINES) {
    throw new CustomError(`Máximo ${MAX_LINES} productos distintos por pedido`, 400);
  }

  // Agrupa por código (dos líneas iguales suman) y valida cantidades.
  const qtyByCode = new Map<string, number>();
  for (const item of rawItems) {
    const code = clean(item?.code, 40).toUpperCase();
    const qty = Number(item?.qty);
    if (!code) throw new CustomError("Hay un producto sin código", 400);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new CustomError("La cantidad de cada producto debe ser de 1 a 99", 400);
    }
    qtyByCode.set(code, (qtyByCode.get(code) ?? 0) + qty);
  }
  for (const qty of qtyByCode.values()) {
    if (qty > 99) throw new CustomError("La cantidad de cada producto debe ser de 1 a 99", 400);
  }

  const customerIn = body?.customer ?? {};
  const customer = {
    name: clean(customerIn.name, 120),
    phone: normalizeEcPhone(customerIn.phone),
    email: clean(customerIn.email, 160).toLowerCase(),
    city: clean(customerIn.city, 80),
    address: clean(customerIn.address, 300),
    idNumber: clean(customerIn.idNumber, 20).replace(/\D/g, ""),
  };
  if (!customer.name) throw new CustomError("Escribe tu nombre", 400);
  if (!customer.phone) throw new CustomError("Escribe un teléfono válido de Ecuador", 400);
  if (customer.email && !EMAIL.test(customer.email)) throw new CustomError("Correo inválido", 400);

  const delivery = clean(body?.delivery, 10);
  if (delivery !== "envio" && delivery !== "retiro") {
    throw new CustomError("Elige envío o retiro en sucursal", 400);
  }
  const branch = clean(body?.branch, 40);
  if (delivery === "envio" && !customer.city)
    throw new CustomError("Escribe tu ciudad de entrega", 400);
  if (delivery === "retiro" && !BRANCHES.some((b) => b.id === branch)) {
    throw new CustomError("Elige la sucursal donde vas a retirar", 400);
  }

  // Precios siempre desde la BD.
  const products = await Product.find({ code: { $in: [...qtyByCode.keys()] }, isActive: true });
  const items: IOrderItem[] = [...qtyByCode.entries()].map(([code, qty]) => {
    const product = products.find((p) => p.code === code);
    if (!product) throw new CustomError(`El producto ${code} ya no está disponible`, 400);
    return {
      productId: product._id as Types.ObjectId,
      code: product.code,
      name: product.name,
      priceCents: product.priceCents,
      qty,
      image: product.images[0]?.url ?? "",
    };
  });
  const totalCents = items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);

  const base = {
    items,
    totalCents,
    customer,
    delivery,
    branch: delivery === "retiro" ? branch : "",
    notes: clean(body?.notes, 500),
    channel: "whatsapp" as const,
    status: "pending" as const,
  };

  // Colisión de código: improbable, pero se reintenta.
  let order;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    try {
      order = await Order.create({ ...base, code: generateOrderCode() });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
    }
  }
  if (!order) throw new CustomError("No pudimos registrar el pedido. Intenta de nuevo.", 500);

  return { order, whatsappUrl: buildWhatsappUrl(order) };
}

export function buildWhatsappUrl(
  order: Pick<
    IOrder,
    "code" | "items" | "totalCents" | "customer" | "delivery" | "branch" | "notes"
  >,
): string {
  const branchName = BRANCHES.find((b) => b.id === order.branch)?.name ?? "";
  const lines = [
    `Hola Impvest, acabo de hacer el pedido ${order.code}:`,
    ...order.items.map(
      (i) => `• ${i.qty} x ${i.name} (${i.code}) ${formatUSD(i.priceCents * i.qty)}`,
    ),
    `Total: ${formatUSD(order.totalCents)}`,
    order.delivery === "retiro"
      ? `Retiro en sucursal: ${branchName}`
      : `Envío a: ${order.customer.city}${order.customer.address ? `, ${order.customer.address}` : ""}`,
    `A nombre de: ${order.customer.name}`,
  ];
  if (order.notes) lines.push(`Nota: ${order.notes}`);
  return `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export async function list(query: {
  status?: unknown;
  q?: unknown;
  page?: unknown;
  limit?: unknown;
}) {
  const page = Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit ?? "30"), 10) || 30));
  const filter: FilterQuery<IOrder> = {};

  const status = String(query.status ?? "").trim();
  if (status) {
    if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
      throw new CustomError("Estado inválido", 400);
    }
    filter.status = status;
  }

  const q = clean(query.q, 80);
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { code: rx },
      { "customer.name": rx },
      { "customer.phone": rx },
      { "items.code": rx },
    ];
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function updateStatus(id: string, status: unknown) {
  if (!Types.ObjectId.isValid(id)) throw new CustomError("Pedido no encontrado", 404);
  const value = String(status ?? "");
  if (!(ORDER_STATUSES as readonly string[]).includes(value)) {
    throw new CustomError("Estado inválido", 400);
  }
  const order = await Order.findByIdAndUpdate(
    id,
    { status: value as OrderStatus },
    { new: true, runValidators: true },
  );
  if (!order) throw new CustomError("Pedido no encontrado", 404);
  return order;
}

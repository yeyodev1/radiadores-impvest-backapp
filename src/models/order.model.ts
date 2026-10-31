import mongoose, { Schema, Types } from "mongoose";

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface IOrderItem {
  productId: Types.ObjectId;
  code: string;
  name: string;
  priceCents: number;
  qty: number;
  image: string;
}

export interface IOrder {
  code: string;
  items: IOrderItem[];
  totalCents: number;
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    idNumber: string;
  };
  delivery: "envio" | "retiro";
  branch: string;
  notes: string;
  channel: "whatsapp" | "payphone";
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const itemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    priceCents: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    code: { type: String, required: true, unique: true },
    items: { type: [itemSchema], required: true },
    totalCents: { type: Number, required: true, min: 0 },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: "", trim: true, lowercase: true },
      city: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
      idNumber: { type: String, default: "", trim: true },
    },
    delivery: { type: String, enum: ["envio", "retiro"], required: true },
    branch: { type: String, default: "" },
    notes: { type: String, default: "", trim: true },
    channel: { type: String, enum: ["whatsapp", "payphone"], default: "whatsapp" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1 });

orderSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    ret.items = (ret.items ?? []).map((item: any) => ({
      ...item,
      productId: String(item.productId),
    }));
    return ret;
  },
});

export const Order =
  (mongoose.models.Order as mongoose.Model<IOrder>) || mongoose.model<IOrder>("Order", orderSchema);

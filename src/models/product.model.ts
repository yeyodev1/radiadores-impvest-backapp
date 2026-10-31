import mongoose, { Schema } from "mongoose";
import { CATEGORIES, Category, SEGMENTS, Segment } from "../config/business";
import { normalizeText } from "../utils/text";

export interface IProductImage {
  url: string;
  publicId: string | null;
}

export interface IProduct {
  code: string;
  slug: string;
  name: string;
  brand: string;
  model: string;
  segment: Segment;
  category: Category;
  priceCents: number;
  description: string;
  compatibility: string[];
  images: IProductImage[];
  featured: boolean;
  inStock: boolean;
  isActive: boolean;
  searchText: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const imageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: null },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, default: "", trim: true },
    segment: { type: String, enum: SEGMENTS, required: true },
    category: { type: String, enum: CATEGORIES, default: "radiador" },
    priceCents: { type: Number, required: true, min: 0 },
    description: { type: String, default: "", trim: true },
    compatibility: { type: [String], default: [] },
    images: { type: [imageSchema], default: [] },
    featured: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    // Copia normalizada (sin tildes) de los campos buscables: "citroen" encuentra "Citroën".
    searchText: { type: String, default: "", select: false },
  },
  { timestamps: true },
);

productSchema.index({ isActive: 1, segment: 1 });
productSchema.index({ isActive: 1, brand: 1 });
productSchema.index({ isActive: 1, featured: 1 });

// El slug sale siempre del código y la búsqueda se recalcula en cada guardado.
productSchema.pre("validate", function (next) {
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
    this.slug = this.code.toLowerCase();
  }
  this.priceCents = Math.round(this.priceCents ?? 0);
  this.searchText = normalizeText(
    [this.code, this.name, this.brand, this.model, ...(this.compatibility ?? [])].join(" "),
  );
  next();
});

productSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.searchText;
    return ret;
  },
});

export const Product =
  (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("Product", productSchema);

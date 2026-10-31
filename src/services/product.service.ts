import { FilterQuery, Types } from "mongoose";
import { CATEGORIES, SEGMENTS } from "../config/business";
import { CustomError } from "../errors/customError.error";
import { IProduct, IProductImage, Product } from "../models/product.model";
import { escapeRegex, normalizeText } from "../utils/text";
import { deleteImage, isCloudinaryConfigured } from "./cloudinary.service";

export interface ListQuery {
  q?: unknown;
  segment?: unknown;
  brand?: unknown;
  category?: unknown;
  featured?: unknown;
  page?: unknown;
  limit?: unknown;
}

function toInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function buildFilter(query: ListQuery, onlyActive: boolean): FilterQuery<IProduct> {
  const filter: FilterQuery<IProduct> = {};
  if (onlyActive) filter.isActive = true;

  const segment = String(query.segment ?? "").trim();
  if (segment && segment !== "todos") {
    if (!(SEGMENTS as readonly string[]).includes(segment)) {
      throw new CustomError("Tipo de vehículo inválido", 400);
    }
    filter.segment = segment;
  }

  const category = String(query.category ?? "").trim();
  if (category) {
    if (!(CATEGORIES as readonly string[]).includes(category)) {
      throw new CustomError("Categoría inválida", 400);
    }
    filter.category = category;
  }

  const brand = String(query.brand ?? "").trim();
  if (brand) filter.brand = new RegExp(`^${escapeRegex(brand)}$`, "i");

  if (String(query.featured ?? "") === "1" || query.featured === "true") filter.featured = true;

  // Cada palabra debe aparecer: "jac sun" encuentra "JAC Sunray".
  const terms = normalizeText(query.q).split(" ").filter(Boolean).slice(0, 8);
  if (terms.length) {
    filter.$and = terms.map((t) => ({ searchText: { $regex: escapeRegex(t) } }));
  }
  return filter;
}

export async function list(query: ListQuery, options: { onlyActive: boolean }) {
  const page = toInt(query.page, 1, 1, 10_000);
  const limit = toInt(query.limit, 24, 1, 100);
  const filter = buildFilter(query, options.onlyActive);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ featured: -1, brand: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function facets() {
  const [brands, segments, total] = await Promise.all([
    Product.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Product.aggregate<{ _id: string; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: "$segment", count: { $sum: 1 } } },
    ]),
    Product.countDocuments({ isActive: true }),
  ]);

  return {
    brands: brands.map((b) => ({ name: b._id, count: b.count })),
    segments: SEGMENTS.map((id) => ({
      id,
      count: segments.find((s) => s._id === id)?.count ?? 0,
    })),
    total,
  };
}

export async function getBySlug(slug: string) {
  const product = await Product.findOne({
    slug: String(slug).toLowerCase().trim(),
    isActive: true,
  });
  if (!product) throw new CustomError("Producto no encontrado", 404);
  return product;
}

export async function getById(id: string) {
  if (!Types.ObjectId.isValid(id)) throw new CustomError("Producto no encontrado", 404);
  const product = await Product.findById(id);
  if (!product) throw new CustomError("Producto no encontrado", 404);
  return product;
}

/** Normaliza el body del admin. `partial` = PUT (solo lo que viene). */
function parseInput(body: any, partial: boolean): Partial<IProduct> {
  const data: Partial<IProduct> = {};
  const has = (key: string) => body && Object.prototype.hasOwnProperty.call(body, key);
  const text = (key: string) => String(body[key] ?? "").trim();

  for (const key of ["code", "name", "brand", "model", "description"] as const) {
    if (has(key)) data[key] = text(key);
  }

  if (has("segment")) {
    if (!(SEGMENTS as readonly string[]).includes(text("segment"))) {
      throw new CustomError("Tipo de vehículo inválido", 400);
    }
    data.segment = text("segment") as IProduct["segment"];
  }
  if (has("category")) {
    if (!(CATEGORIES as readonly string[]).includes(text("category"))) {
      throw new CustomError("Categoría inválida", 400);
    }
    data.category = text("category") as IProduct["category"];
  }

  if (has("priceCents") || has("price")) {
    const cents = has("priceCents")
      ? Number(body.priceCents)
      : Math.round(Number(String(body.price).replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) throw new CustomError("Precio inválido", 400);
    data.priceCents = Math.round(cents);
  }

  if (has("compatibility")) {
    const raw = Array.isArray(body.compatibility)
      ? body.compatibility
      : String(body.compatibility ?? "").split(/\n|,/);
    data.compatibility = raw
      .map((c: unknown) => String(c).trim())
      .filter(Boolean)
      .slice(0, 50);
  }

  if (has("images")) {
    if (!Array.isArray(body.images)) throw new CustomError("Imágenes inválidas", 400);
    data.images = body.images
      .map((img: any) => ({
        url: String(img?.url ?? "").trim(),
        publicId: img?.publicId ? String(img.publicId) : null,
      }))
      .filter((img: IProductImage) => img.url)
      .slice(0, 12);
  }

  for (const key of ["featured", "inStock", "isActive"] as const) {
    if (has(key)) data[key] = body[key] === true || body[key] === "true";
  }

  if (!partial) {
    if (!data.code) throw new CustomError("El código es obligatorio", 400);
    if (!data.name) throw new CustomError("El nombre es obligatorio", 400);
    if (!data.brand) throw new CustomError("La marca es obligatoria", 400);
    if (!data.segment) throw new CustomError("El tipo de vehículo es obligatorio", 400);
    if (data.priceCents === undefined) throw new CustomError("El precio es obligatorio", 400);
  }
  if (has("code") && !data.code) throw new CustomError("El código es obligatorio", 400);
  if (has("name") && !data.name) throw new CustomError("El nombre es obligatorio", 400);

  return data;
}

export async function create(body: unknown) {
  const data = parseInput(body, false);
  return Product.create(data);
}

export async function update(id: string, body: unknown) {
  const product = await getById(id);
  const data = parseInput(body, true);
  const previous = product.images.map((img) => img.publicId).filter(Boolean) as string[];

  product.set(data);
  await product.save();

  // Las imágenes que se quitaron en el admin se borran de Cloudinary.
  if (data.images) {
    const kept = new Set(product.images.map((img) => img.publicId));
    await removeImages(previous.filter((p) => !kept.has(p)));
  }
  return product;
}

export async function remove(id: string) {
  const product = await getById(id);
  const publicIds = product.images.map((img) => img.publicId).filter(Boolean) as string[];
  await product.deleteOne();
  await removeImages(publicIds);
}

async function removeImages(publicIds: string[]) {
  if (!publicIds.length || !isCloudinaryConfigured()) return;
  await Promise.all(
    publicIds.map((id) =>
      deleteImage(id).catch((error) => console.error("[cloudinary] no se pudo borrar", id, error)),
    ),
  );
}

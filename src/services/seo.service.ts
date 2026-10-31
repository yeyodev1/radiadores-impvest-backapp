import { Product } from "../models/product.model";
import { env } from "../config/env";

function escapeXml(value: string): string {
  return value.replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? c,
  );
}

/** Sitemap con el inicio y la ficha de cada producto activo. */
export async function sitemap(originInput: unknown): Promise<string> {
  const raw = String(originInput ?? "").trim();
  const origin = /^https?:\/\/[^\s/]+$/i.test(raw.replace(/\/+$/, ""))
    ? raw.replace(/\/+$/, "")
    : env.FRONTEND_URL;

  const products = await Product.find({ isActive: true })
    .select("slug updatedAt")
    .sort({ slug: 1 });
  const url = (path: string, lastmod: Date | undefined, priority: string) =>
    [
      "  <url>",
      `    <loc>${escapeXml(origin + path)}</loc>`,
      `    <lastmod>${(lastmod ?? new Date()).toISOString().slice(0, 10)}</lastmod>`,
      "    <changefreq>weekly</changefreq>",
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    url("/", new Date(), "1.0"),
    ...products.map((p) => url(`/producto/${p.slug}`, p.updatedAt, "0.8")),
    "</urlset>",
  ].join("\n");
}

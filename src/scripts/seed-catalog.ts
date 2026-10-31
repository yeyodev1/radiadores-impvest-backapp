/**
 * Seed del catálogo inicial (15 radiadores que mandó el cliente).
 * Uso: pnpm seed:catalog            → crea los que falten (idempotente)
 *      pnpm seed:catalog --force    → sobrescribe con estos datos (y sube las fotos a Cloudinary si hay llaves)
 *
 * Sin llaves de Cloudinary la imagen queda como "/products/<CODE>.webp", que sirve el front.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { env } from "../config/env";
import { Product } from "../models/product.model";
import { isCloudinaryConfigured, uploadImage } from "../services/cloudinary.service";
import type { Segment } from "../config/business";

const FEATURED = [
  "RD-JC-011",
  "RD-RE-003",
  "RD-MT-018",
  "RD-ME-010",
  "RD-KI-029",
  "RD-CK-005",
  "RD-JC-009",
];

const SEED: {
  code: string;
  name: string;
  brand: string;
  model: string;
  segment: Segment;
  price: number;
}[] = [
  {
    code: "RD-JC-011",
    name: "Radiador JAC Sunray",
    brand: "JAC",
    model: "Sunray",
    segment: "vans-buses",
    price: 158.7,
  },
  {
    code: "RD-RE-003",
    name: "Radiador Renault Duster con aire",
    brand: "Renault",
    model: "Duster (con A/C)",
    segment: "autos",
    price: 85.1,
  },
  {
    code: "RD-CH-014",
    name: "Radiador Changan CS55",
    brand: "Changan",
    model: "CS55",
    segment: "autos",
    price: 110.4,
  },
  {
    code: "RD-CH-011",
    name: "Radiador GAC GS4",
    brand: "GAC",
    model: "GS4",
    segment: "autos",
    price: 111.09,
  },
  {
    code: "RD-CT-002",
    name: "Radiador Citroën C3",
    brand: "Citroën",
    model: "C3",
    segment: "autos",
    price: 112.7,
  },
  {
    code: "RD-KI-029",
    name: "Radiador Kia Carens Rondo",
    brand: "Kia",
    model: "Carens Rondo",
    segment: "autos",
    price: 123.05,
  },
  {
    code: "RD-MT-018",
    name: "Radiador Mitsubishi Lancer 1.3i",
    brand: "Mitsubishi",
    model: "Lancer 1.3i",
    segment: "autos",
    price: 128.8,
  },
  {
    code: "RD-HO-005",
    name: "Radiador Honda Odyssey",
    brand: "Honda",
    model: "Odyssey",
    segment: "autos",
    price: 156.4,
  },
  {
    code: "RD-CK-005",
    name: "Radiador Jeep Cherokee Liberty",
    brand: "Jeep",
    model: "Cherokee Liberty",
    segment: "autos",
    price: 169.28,
  },
  {
    code: "RD-ME-010",
    name: "Radiador Mercedes-Benz Sprinter 95-03",
    brand: "Mercedes-Benz",
    model: "Sprinter 1995-2003",
    segment: "vans-buses",
    price: 195.5,
  },
  {
    code: "RD-YT-001",
    name: "Radiador Yutong extendido",
    brand: "Yutong",
    model: "Bus extendido",
    segment: "vans-buses",
    price: 730.25,
  },
  {
    code: "RD-JC-009",
    name: "Radiador JAC K7 Truck 2022",
    brand: "JAC",
    model: "K7 Truck 2022",
    segment: "camiones",
    price: 678.5,
  },
  {
    code: "RD-KW-008",
    name: "Radiador Kenworth antiguo completo",
    brand: "Kenworth",
    model: "Antiguo (completo)",
    segment: "camiones",
    price: 1380,
  },
  {
    code: "RD-CP-006",
    name: "Radiador Kubota 688 DC70",
    brand: "Kubota",
    model: "688 DC70",
    segment: "maquinaria",
    price: 174.57,
  },
  {
    code: "RD-CP-011",
    name: "Radiador Caterpillar cargador Perkins 416B",
    brand: "Caterpillar",
    model: "Cargador 416B (Perkins)",
    segment: "maquinaria",
    price: 609.5,
  },
];

const IMAGES_DIR = path.resolve(__dirname, "../../seed/products");

async function imageFor(code: string): Promise<{ url: string; publicId: string | null }> {
  const file = path.join(IMAGES_DIR, `${code}.webp`);
  if (isCloudinaryConfigured() && fs.existsSync(file)) {
    const dataUri = `data:image/webp;base64,${fs.readFileSync(file).toString("base64")}`;
    return uploadImage(dataUri);
  }
  return { url: `/products/${code}.webp`, publicId: null };
}

async function main() {
  const force = process.argv.includes("--force");
  await mongoose.connect(env.DB_URI);
  console.log(
    `Conectado. Cloudinary: ${isCloudinaryConfigured() ? "sí" : "no (imágenes locales del front)"}`,
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of SEED) {
    const existing = await Product.findOne({ code: item.code });
    if (existing && !force) {
      skipped++;
      continue;
    }

    // Con --force solo se resube la foto si todavía no está en Cloudinary.
    const needsImage = !existing || !existing.images[0]?.publicId;
    const image = needsImage ? await imageFor(item.code) : existing.images[0];

    const data = {
      code: item.code,
      name: item.name,
      brand: item.brand,
      model: item.model,
      segment: item.segment,
      category: "radiador" as const,
      priceCents: Math.round(item.price * 100),
      description: `${item.name.replace(/^Radiador /, "Radiador para ")}. Importación directa Impvest con garantía de fábrica.`,
      compatibility: [`${item.brand} ${item.model}`],
      images: [image],
      featured: FEATURED.includes(item.code),
      inStock: true,
      isActive: true,
    };

    if (existing) {
      existing.set(data);
      await existing.save();
      updated++;
    } else {
      await Product.create(data);
      created++;
    }
  }

  console.log(`✔ Catálogo: ${created} creados, ${updated} actualizados, ${skipped} sin cambios`);
  if (!isCloudinaryConfigured()) {
    console.log(
      "ℹ Agrega las llaves de Cloudinary al .env y corre `pnpm seed:catalog --force` para subir las fotos.",
    );
  }
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("✖ Falló el seed:", error);
  process.exit(1);
});

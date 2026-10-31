import "dotenv/config";

/**
 * Único lugar que lee process.env. Leerlo en otro archivo a nivel de módulo
 * es el bug clásico de "la variable está en .env pero llega undefined".
 */

function required(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

function list(key: string): string[] {
  return optional(key, "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export const env = {
  PORT: Number(optional("PORT", "8140")),
  NODE_ENV: optional("NODE_ENV", "development"),
  IS_VERCEL: Boolean(process.env.VERCEL),
  APP_ENV: optional("VERCEL_ENV", "development"),
  DB_URI: required("DB_URI"),
  JWT_SECRET: required("JWT_SECRET"),
  CORS_ORIGINS: list("CORS_ORIGINS"),
  FRONTEND_URL: optional("FRONTEND_URL", "http://localhost:5185").replace(/\/+$/, ""),
  SLACK_ERROR_WEBHOOK: optional("SLACK_ERROR_WEBHOOK", ""),
  ADMIN_EMAIL: optional("ADMIN_EMAIL", "admin@radiadoresimpvest.com").toLowerCase(),
  ADMIN_PASSWORD: optional("ADMIN_PASSWORD", ""),
  ADMIN_NAME: optional("ADMIN_NAME", "Impvest"),
  CLOUDINARY_CLOUD_NAME: optional("CLOUDINARY_CLOUD_NAME", ""),
  CLOUDINARY_API_KEY: optional("CLOUDINARY_API_KEY", ""),
  CLOUDINARY_API_SECRET: optional("CLOUDINARY_API_SECRET", ""),
} as const;

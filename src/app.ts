import express from "express";
import cors from "cors";
import http from "http";
import routerApi from "./routes";
import { env } from "./config/env";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.middleware";
import { ensureDb } from "./middlewares/ensureDb.middleware";

const whitelist = [
  "http://localhost:5185",
  "http://127.0.0.1:5185",
  "http://localhost:5173",
  "http://localhost:4173",
  env.FRONTEND_URL,
  ...env.CORS_ORIGINS,
];

/** Previews de Vercel y túneles de desarrollo: permitidos. */
const allowedPatterns: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
  /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i,
  /^https:\/\/[a-z0-9-]+\.bakano\.ec$/i,
  /^https:\/\/(www\.)?radiadoresimpvest\.com$/i,
];

function isOriginAllowed(origin: string): boolean {
  if (whitelist.includes(origin)) return true;
  return allowedPatterns.some((p) => p.test(origin));
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Sin Origin (curl, server-to-server) se deja pasar.
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

export function createApp() {
  const app = express();

  app.set("trust proxy", true);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "2mb" }));

  app.get("/", (_req, res) => {
    res.send("Server is alive");
  });

  // /api/health reporta el estado real de la base: no pasa por el guardia.
  app.use(/^\/api\/(?!health)/, ensureDb);
  routerApi(app);

  app.use((_req, res) => {
    res.status(404).json({ message: "Ruta no encontrada" });
  });
  app.use(globalErrorHandler);

  const server = http.createServer(app);

  return { app, server };
}

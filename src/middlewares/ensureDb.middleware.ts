import { Request, Response, NextFunction } from "express";
import { dbConnect, isConnected } from "../config/mongo";
import { CustomError } from "../errors/customError.error";

/**
 * En serverless una instancia puede atender una petición con la conexión a
 * Mongo recién caída o todavía abriéndose (se vio en producción: un login en
 * frío respondió 503 justo después de "Connected to MongoDB"). Antes de cada
 * ruta se asegura la conexión, con un reintento, en vez de fallar al cliente.
 */
export async function ensureDb(_req: Request, _res: Response, next: NextFunction) {
  if (isConnected()) return next();
  for (let intento = 0; intento < 2; intento++) {
    if (await dbConnect()) return next();
  }
  next(new CustomError("No pudimos conectar con la base de datos. Intenta de nuevo.", 503));
}

import { Request, Response } from "express";
import { isConnected } from "../config/mongo";

/** GET /api/health — estado real de la base (no pasa por ensureDb). */
export function health(_req: Request, res: Response) {
  res.status(200).json({ ok: true, db: isConnected() });
}

import { Request, Response, NextFunction } from "express";
import * as statsService from "../services/stats.service";

/** GET /api/admin/stats */
export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await statsService.stats());
  } catch (error) {
    next(error);
  }
}

import { Request, Response, NextFunction } from "express";
import * as orderService from "../services/order.service";

/** POST /api/orders — crea el pedido y devuelve el enlace de WhatsApp. */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await orderService.create(req.body));
  } catch (error) {
    next(error);
  }
}

/** GET /api/admin/orders */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await orderService.list(req.query));
  } catch (error) {
    next(error);
  }
}

/** PATCH /api/admin/orders/:id/status — body: { status } */
export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await orderService.updateStatus(String(req.params.id), req.body?.status));
  } catch (error) {
    next(error);
  }
}

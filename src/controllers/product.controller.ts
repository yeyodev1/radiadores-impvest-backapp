import { Request, Response, NextFunction } from "express";
import * as productService from "../services/product.service";

/** GET /api/products — catálogo público paginado. */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await productService.list(req.query, { onlyActive: true }));
  } catch (error) {
    next(error);
  }
}

/** GET /api/products/facets — marcas y tipos con conteo. */
export async function facets(_req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await productService.facets());
  } catch (error) {
    next(error);
  }
}

/** GET /api/products/:slug */
export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await productService.getBySlug(String(req.params.slug)));
  } catch (error) {
    next(error);
  }
}

/** GET /api/admin/products — incluye inactivos. */
export async function adminList(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await productService.list(req.query, { onlyActive: false }));
  } catch (error) {
    next(error);
  }
}

/** GET /api/admin/products/:id */
export async function adminGet(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await productService.getById(String(req.params.id)));
  } catch (error) {
    next(error);
  }
}

/** POST /api/admin/products */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await productService.create(req.body));
  } catch (error) {
    next(error);
  }
}

/** PUT /api/admin/products/:id — parcial. */
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json(await productService.update(String(req.params.id), req.body));
  } catch (error) {
    next(error);
  }
}

/** DELETE /api/admin/products/:id */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await productService.remove(String(req.params.id));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

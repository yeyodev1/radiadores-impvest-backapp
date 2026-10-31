import { Request, Response, NextFunction } from "express";
import * as seoService from "../services/seo.service";

/** GET /api/seo/sitemap.xml?origin=https://... */
export async function sitemap(req: Request, res: Response, next: NextFunction) {
  try {
    const xml = await seoService.sitemap(req.query.origin);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
}

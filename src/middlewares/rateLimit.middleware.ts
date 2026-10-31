import { Request, Response, NextFunction } from "express";

/**
 * Límite simple por IP (o por la clave que se pase) en memoria (ventana fija). En Vercel cada instancia lleva
 * su propia cuenta: no es exacto, pero basta para que un script no queme la key
 * de Google a través de un endpoint público.
 */
export function rateLimit(options: {
  max: number;
  windowMs: number;
  message?: string;
  /** Clave alternativa a la IP (p. ej. el correo o la cédula que se consulta). Vacía = no cuenta. */
  key?: (req: Request) => string;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (options.key) {
      const custom = options.key(req);
      if (!custom) return next();
      return count(`k:${custom}`, now, res, next);
    }
    // Detrás de Vercel/Cloudflare la IP real viene en x-forwarded-for.
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() ||
      req.ip ||
      "unknown";
    count(ip, now, res, next);
  };

  function count(id: string, now: number, res: Response, next: NextFunction) {
    let entry = hits.get(id);
    if (!entry || entry.resetAt <= now) {
      if (hits.size > 10_000) {
        for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
      }
      entry = { count: 0, resetAt: now + options.windowMs };
      hits.set(id, entry);
    }
    entry.count++;

    if (entry.count > options.max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({
        message: options.message || "Demasiadas solicitudes. Espera un momento e intenta de nuevo",
      });
      return;
    }
    next();
  }
}

# CLAUDE.md

API de la tienda de Radiadores Impvest. El front vive en el repo hermano `radiadores-impvest-frontapp`.
El contrato con el front está en `../CONTRATO-API.md`: si cambias una respuesta, actualízalo.

## Comandos

- **Mongo local:** `docker start radiadores-mongo` (puerto 27025)
- **Dev:** `pnpm dev` (ts-node-dev, puerto 8140)
- **Build:** `pnpm build` (tsc → `dist/`). No hay tests ni linter: el build es la verificación.
- **Seed admin:** `pnpm seed:admin` (crea o resetea la cuenta de `ADMIN_EMAIL` con `ADMIN_PASSWORD`)
- **Seed catálogo:** `pnpm seed:catalog` (idempotente; `--force` sobrescribe y sube las fotos de `seed/products/` a Cloudinary si hay llaves)
- **Format:** `pnpm format`

## Stack

- Express 5 + TypeScript (CommonJS, ES2024), MongoDB con Mongoose (`DB_URI`)
- JWT Bearer 30 días (`JWT_SECRET`), solo cuentas `admin`
- Cloudinary para las fotos (`radiadores-impvest/productos`); multer en memoria (Vercel no tiene disco)
- Vercel: `api/index.ts` es la función y `vercel.json` reescribe todo a `/api`

## Arquitectura

`Express → CORS → JSON → ensureDb → /api router → controllers → services → models → globalErrorHandler`

- **Routes** definen endpoints y middlewares; **controllers** solo parsean y responden; **services** tienen la lógica
  y lanzan `CustomError("mensaje en español", status)`; **models** son schemas Mongoose.
- **Env:** solo `src/config/env.ts` lee `process.env`.
- **Respuestas:** cuerpo desnudo, paginación `{ items, total, page, pages }`, errores `{ message }`.
- **Montos en centavos.** `POST /orders` toma los precios de la BD, nunca del cliente, y devuelve el `whatsappUrl`
  del pedido (`wa.me/593998738671`). Código de pedido `IV-XXXXXX` sin caracteres ambiguos.
- **Producto:** `slug` = `code` en minúsculas (se recalcula en `pre("validate")`), `searchText` normalizado sin tildes
  para la búsqueda (`q` exige todas las palabras). Borrar un producto o quitarle una foto borra la imagen en Cloudinary.
- **Hora de negocio:** America/Guayaquil (UTC-5 fijo) en `utils/businessTime.ts` para las estadísticas.
- Sin llaves de Cloudinary, `POST /admin/uploads` responde 503 y el seed guarda `/products/<CODE>.webp` (lo sirve el front).

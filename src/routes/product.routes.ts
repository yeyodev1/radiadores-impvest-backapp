import { Router } from "express";
import * as productController from "../controllers/product.controller";

const router = Router();

// /facets va antes que /:slug para no confundirse con un slug.
router.get("/", productController.list);
router.get("/facets", productController.facets);
router.get("/:slug", productController.getBySlug);

export default router;

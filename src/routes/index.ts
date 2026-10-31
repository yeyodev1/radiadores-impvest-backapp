import express, { Application } from "express";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";
import orderRoutes from "./order.routes";
import productRoutes from "./product.routes";
import seoRoutes from "./seo.routes";

function routerApi(app: Application) {
  const router = express.Router();
  app.use("/api", router);

  router.use("/health", healthRoutes);
  router.use("/auth", authRoutes);
  router.use("/products", productRoutes);
  router.use("/orders", orderRoutes);
  router.use("/seo", seoRoutes);
  router.use("/admin", adminRoutes);
}

export default routerApi;

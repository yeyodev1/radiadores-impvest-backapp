import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import * as productController from "../controllers/product.controller";
import * as statsController from "../controllers/stats.controller";
import * as uploadController from "../controllers/upload.controller";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadMiddleware } from "../middlewares/upload.middleware";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/stats", statsController.stats);

router.get("/products", productController.adminList);
router.get("/products/:id", productController.adminGet);
router.post("/products", productController.create);
router.put("/products/:id", productController.update);
router.delete("/products/:id", productController.remove);

router.post("/uploads", uploadMiddleware.single("image"), uploadController.uploadImage);

router.get("/orders", orderController.list);
router.patch("/orders/:id/status", orderController.updateStatus);

export default router;

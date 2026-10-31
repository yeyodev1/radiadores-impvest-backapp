import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { rateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post(
  "/",
  rateLimit({
    max: 10,
    windowMs: 15 * 60 * 1000,
    message: "Hiciste muchos pedidos seguidos. Espera unos minutos o escríbenos por WhatsApp",
  }),
  orderController.create,
);

export default router;

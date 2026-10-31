import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import * as authController from "../controllers/auth.controller";
import { rateLimit } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post(
  "/login",
  rateLimit({
    max: 20,
    windowMs: 15 * 60 * 1000,
    message: "Demasiados intentos. Espera unos minutos",
  }),
  authController.login,
);

router.use(authMiddleware);

router.get("/me", authController.me);
router.put("/password", authController.changePassword);

export default router;

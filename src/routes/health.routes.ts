import { Router } from "express";
import * as healthController from "../controllers/health.controller";

const router = Router();
router.get("/", healthController.health);
export default router;

import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import { createStockAdjustment } from "../controllers/stockAdjustment.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), createStockAdjustment);

export default router;
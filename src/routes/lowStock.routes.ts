import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  acknowledgeLowStockAlert,
  getLowStockAlerts,
} from "../controllers/lowStock.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), getLowStockAlerts);
router.patch("/:id/acknowledge", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), acknowledgeLowStockAlert);

export default router;
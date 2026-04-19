    import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import { getMyInventoryDashboard } from "../controllers/vendorDashboard.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get(
  "/inventory",
  protect,
  allowRoles(ROLES.VENDOR),
  getMyInventoryDashboard
);

export default router;
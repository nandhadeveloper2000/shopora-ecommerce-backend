import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  getAdminDashboardAnalytics,
  getVendorDashboardAnalytics,
} from "../controllers/dashboard.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get(
  "/admin",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  getAdminDashboardAnalytics
);

router.get(
  "/vendor/:vendorId",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN, ROLES.VENDOR),
  getVendorDashboardAnalytics
);

export default router;
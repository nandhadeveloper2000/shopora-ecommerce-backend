import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  getInventoryLedger,
  getInventoryListing,
  manualStockAdjust,
} from "../controllers/inventoryAdmin.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get(
  "/ledger",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  getInventoryLedger
);

router.get(
  "/listing/:vendorListingId",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  getInventoryListing
);

router.patch(
  "/listing/:vendorListingId/adjust",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  manualStockAdjust
);

export default router;
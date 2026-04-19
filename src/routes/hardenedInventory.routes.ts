import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import { auditMiddleware } from "../middlewares/audit.middleware";
import { createRateLimiter } from "../middlewares/rateLimit.middleware";
import {
  getInventoryLedger,
  manualStockAdjust,
} from "../controllers/inventoryAdmin.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get(
  "/ledger",
  protect,
  createRateLimiter({ limit: 100, windowMs: 60_000 }),
  auditMiddleware({
    action: "INVENTORY_LEDGER_VIEW",
    entityType: "InventoryLedger",
  }),
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  getInventoryLedger
);

router.patch(
  "/listing/:vendorListingId/adjust",
  protect,
  createRateLimiter({ limit: 20, windowMs: 60_000 }),
  auditMiddleware({
    action: "INVENTORY_MANUAL_ADJUST",
    entityType: "VendorListing",
    getEntityId: (req) => req.params.vendorListingId,
  }),
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  manualStockAdjust
);

export default router;
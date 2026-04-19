import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  generateSettlementEntriesForOrder,
  getAdminSettlementLedger,
  markSettlementPaid,
  getVendorPayoutReport,
} from "../controllers/settlement.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/generate",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  generateSettlementEntriesForOrder
);

router.get(
  "/ledger",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  getAdminSettlementLedger
);

router.patch(
  "/ledger/:id/pay",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  markSettlementPaid
);

router.get(
  "/vendor/:vendorId/report",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  getVendorPayoutReport
);

export default router;
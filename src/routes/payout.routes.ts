import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  executeSettlementPayout,
  upsertVendorFundAccount,
} from "../controllers/payout.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/fund-account",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  upsertVendorFundAccount
);

router.post(
  "/settlement/:settlementId/execute",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  executeSettlementPayout
);

export default router;
import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  createReturnRequest,
  approveReturnRequest,
  receiveReturnedItems,
  createRefundRequest,
  processRefundRequest,
} from "../controllers/returnRefund.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/returns", protect, createReturnRequest);
router.patch(
  "/returns/:id/approve",
  protect,
  allowRoles(ROLES.VENDOR, ROLES.ADMIN, ROLES.MASTER_ADMIN),
  approveReturnRequest
);
router.patch(
  "/returns/:id/receive",
  protect,
  allowRoles(ROLES.VENDOR, ROLES.ADMIN, ROLES.MASTER_ADMIN),
  receiveReturnedItems
);

router.post("/refunds", protect, createRefundRequest);
router.patch(
  "/refunds/:id/process",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  processRefundRequest
);

export default router;
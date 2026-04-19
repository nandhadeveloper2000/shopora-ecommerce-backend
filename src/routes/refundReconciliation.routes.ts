import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import { getRefundReconciliation } from "../controllers/refundReconciliation.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), getRefundReconciliation);

export default router;
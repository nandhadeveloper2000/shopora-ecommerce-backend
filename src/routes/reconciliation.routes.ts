import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import { getStockReconciliationReport } from "../controllers/reconciliation.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get("/stock", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), getStockReconciliationReport);

export default router;
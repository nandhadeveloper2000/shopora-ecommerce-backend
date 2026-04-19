import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  exportGstCsv,
  exportInventoryCsv,
  exportSettlementCsv,
} from "../controllers/export.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get("/settlements.csv", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), exportSettlementCsv);
router.get("/inventory.csv", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), exportInventoryCsv);
router.get("/gst.csv", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), exportGstCsv);

export default router;
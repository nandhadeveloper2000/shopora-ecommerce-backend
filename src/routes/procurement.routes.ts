import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  createPurchaseOrder,
  receiveGrn,
} from "../controllers/procurement.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/purchase-orders", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), createPurchaseOrder);
router.post("/grn", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), receiveGrn);

export default router;
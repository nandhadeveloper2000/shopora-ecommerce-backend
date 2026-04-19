import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  createPurchaseReturn,
  markPurchaseReturnReturned,
} from "../controllers/purchaseReturn.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), createPurchaseReturn);
router.patch("/:id/return", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), markPurchaseReturnReturned);

export default router;
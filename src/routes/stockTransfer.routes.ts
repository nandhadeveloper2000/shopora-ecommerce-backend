import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  completeStockTransfer,
  createStockTransfer,
} from "../controllers/stockTransfer.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), createStockTransfer);
router.patch("/:id/complete", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), completeStockTransfer);

export default router;
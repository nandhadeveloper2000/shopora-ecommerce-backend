import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  allocateOrderWarehouse,
  releaseOrderReservation,
} from "../controllers/allocation.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/allocate",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  allocateOrderWarehouse
);

router.patch(
  "/reservations/:reservationId/release",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  releaseOrderReservation
);

export default router;
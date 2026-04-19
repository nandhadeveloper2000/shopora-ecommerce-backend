import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  enqueueEvent,
  processPendingEvents,
} from "../controllers/queue.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/enqueue",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  enqueueEvent
);

router.post(
  "/process",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  processPendingEvents
);

export default router;
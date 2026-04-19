import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  createPacking,
  createPicklist,
  createShipment,
  markShipmentDelivered,
  pickWithFefo,
} from "../controllers/fulfillment.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/picklists", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN, ROLES.VENDOR), createPicklist);
router.patch("/picklists/:picklistId/pick-fefo", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN, ROLES.VENDOR), pickWithFefo);

router.post("/packings", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN, ROLES.VENDOR), createPacking);

router.post("/shipments", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN, ROLES.VENDOR), createShipment);
router.patch("/shipments/:shipmentId/deliver", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN, ROLES.VENDOR), markShipmentDelivered);

export default router;
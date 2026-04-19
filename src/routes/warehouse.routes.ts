import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  createWarehouse,
  createStockLocation,
  getWarehouses,
  getStockLocations,
} from "../controllers/warehouse.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), createWarehouse);
router.get("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), getWarehouses);

router.post("/locations", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), createStockLocation);
router.get("/locations", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), getStockLocations);

export default router;
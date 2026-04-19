import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  getExpiringBatches,
  runExpiryAlertJob,
} from "../controllers/expiry.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get("/batches", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN, ROLES.VENDOR), getExpiringBatches);
router.post("/run-alert-job", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), runExpiryAlertJob);

export default router;
import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  runLowStockReminderJob,
  runSettlementReminderJob,
} from "../controllers/job.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/low-stock-reminders", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), runLowStockReminderJob);
router.post("/settlement-reminders", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), runSettlementReminderJob);

export default router;
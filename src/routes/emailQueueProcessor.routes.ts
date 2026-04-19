import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import { processEmailQueue } from "../controllers/emailQueueProcessor.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/process", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), processEmailQueue);

export default router;
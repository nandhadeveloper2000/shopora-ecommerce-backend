import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import { getGstSummaryReport } from "../controllers/gstReport.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get("/summary", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), getGstSummaryReport);

export default router;
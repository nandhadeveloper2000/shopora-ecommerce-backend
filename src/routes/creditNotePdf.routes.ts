import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import { downloadCreditNotePdf } from "../controllers/creditNotePdf.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.get("/:id/pdf", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), downloadCreditNotePdf);

export default router;
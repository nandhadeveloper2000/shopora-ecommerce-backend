import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import { issueCreditNote } from "../controllers/creditNote.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/issue",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  issueCreditNote
);

export default router;
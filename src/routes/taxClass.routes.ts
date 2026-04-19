import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  createTaxClass,
  deleteTaxClass,
  getTaxClasses,
  updateTaxClass,
} from "../controllers/taxClass.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), createTaxClass);
router.get("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), getTaxClasses);
router.put("/:id", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), updateTaxClass);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), deleteTaxClass);

export default router;
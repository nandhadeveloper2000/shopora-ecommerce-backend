import { Router } from "express";
import {
  createMasterCategory,
  deleteMasterCategory,
  getMasterCategories,
  getSingleMasterCategory,
  updateMasterCategory,
} from "../controllers/masterCategory.controller";
import { allowRoles, protect } from "../middlewares/auth.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  createMasterCategory
);

router.get("/", getMasterCategories);
router.get("/:id", getSingleMasterCategory);

router.put(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  updateMasterCategory
);

router.delete(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  deleteMasterCategory
);

export default router;
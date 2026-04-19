import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getSingleCategory,
  updateCategory,
} from "../controllers/category.controller";
import { allowRoles, protect } from "../middlewares/auth.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  createCategory
);

router.get("/", getCategories);
router.get("/:id", getSingleCategory);

router.put(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  updateCategory
);

router.delete(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  deleteCategory
);

export default router;
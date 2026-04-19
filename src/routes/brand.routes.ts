import { Router } from "express";
import {
  createBrand,
  deleteBrand,
  getBrands,
  getSingleBrand,
  updateBrand,
} from "../controllers/brand.controller";
import { allowRoles, protect } from "../middlewares/auth.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  createBrand
);

router.get("/", getBrands);
router.get("/:id", getSingleBrand);

router.put(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  updateBrand
);

router.delete(
  "/:id",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  deleteBrand
);

export default router;
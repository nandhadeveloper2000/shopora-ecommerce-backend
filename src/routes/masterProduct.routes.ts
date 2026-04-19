import { Router } from "express";
import {
  createMasterProduct,
  deleteMasterProduct,
  getMasterProducts,
  getSingleMasterProduct,
  updateMasterProduct,
} from "../controllers/masterProduct.controller";
import { allowRoles, protect } from "../middlewares/auth.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles(ROLES.MASTER_ADMIN, ROLES.ADMIN),
  createMasterProduct
);

router.get("/", getMasterProducts);
router.get("/:id", getSingleMasterProduct);

router.put(
  "/:id",
  protect,
  allowRoles(ROLES.MASTER_ADMIN, ROLES.ADMIN),
  updateMasterProduct
);

router.delete(
  "/:id",
  protect,
  allowRoles(ROLES.MASTER_ADMIN, ROLES.ADMIN),
  deleteMasterProduct
);

export default router;
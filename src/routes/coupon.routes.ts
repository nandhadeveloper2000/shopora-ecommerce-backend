import { Router } from "express";
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  getSingleCoupon,
  updateCoupon,
} from "../controllers/coupon.controller";
import { allowRoles, protect } from "../middlewares/auth.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.post(
  "/",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  createCoupon
);

router.get("/", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), getCoupons);
router.get("/:id", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), getSingleCoupon);
router.put("/:id", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), updateCoupon);
router.delete("/:id", protect, allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN), deleteCoupon);

export default router;
import { Router } from "express";
import { protect, allowRoles } from "../middlewares/auth.middleware";
import {
  approveFundAccount,
  getAllFundAccountsForAdmin,
  getMyFundAccount,
  rejectFundAccount,
  submitMyFundAccount,
} from "../controllers/vendorFundAccount.controller";
import { ROLES } from "../constants/roles";

const router = Router();

router.post("/submit", protect, allowRoles(ROLES.VENDOR), submitMyFundAccount);
router.get("/my/:shopId", protect, allowRoles(ROLES.VENDOR), getMyFundAccount);

router.get(
  "/admin/all",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  getAllFundAccountsForAdmin
);

router.patch(
  "/admin/:id/approve",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  approveFundAccount
);

router.patch(
  "/admin/:id/reject",
  protect,
  allowRoles(ROLES.ADMIN, ROLES.MASTER_ADMIN),
  rejectFundAccount
);

export default router;
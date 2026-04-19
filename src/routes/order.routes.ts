import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  cancelMyVendorBucket,
  getMyOrders,
  getMySingleOrder,
  getVendorOrders,
  getVendorSingleOrder,
  updateVendorOrderStatus,
} from "../controllers/order.controller";

const router = Router();

router.get("/my", protect, getMyOrders);
router.get("/my/:id", protect, getMySingleOrder);
router.post("/my/:id/cancel-vendor", protect, cancelMyVendorBucket);

router.get("/vendor", protect, getVendorOrders);
router.get("/vendor/:id", protect, getVendorSingleOrder);
router.patch("/vendor/:id/status", protect, updateVendorOrderStatus);

export default router;
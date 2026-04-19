import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  cancelMyOrder,
  checkoutCart,
  verifyOnlinePayment,
} from "../controllers/checkout.controller";

const router = Router();

router.post("/", protect, checkoutCart);
router.post("/verify-payment", protect, verifyOnlinePayment);
router.post("/cancel/:id", protect, cancelMyOrder);

export default router;
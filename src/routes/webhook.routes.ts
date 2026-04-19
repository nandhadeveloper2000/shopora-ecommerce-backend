import { Router } from "express";
import { handleRazorpayWebhook } from "../controllers/webhook.controller";

const router = Router();

router.post("/razorpay", handleRazorpayWebhook);

export default router;
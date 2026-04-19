import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { emailOrderInvoice } from "../controllers/invoiceEmail.controller";

const router = Router();

router.post("/order/:id/email", protect, emailOrderInvoice);

export default router;
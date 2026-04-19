import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  downloadOrderInvoicePdf,
  downloadVendorInvoicePdf,
} from "../controllers/invoice.controller";

const router = Router();

router.get("/order/:id", protect, downloadOrderInvoicePdf);
router.get("/order/:id/vendor/:shopId", protect, downloadVendorInvoicePdf);

export default router;
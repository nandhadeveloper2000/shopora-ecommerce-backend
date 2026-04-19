import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { OrderModel } from "../models/order.model";
import { buildInvoicePdf } from "../utils/pdfInvoice";
import { ROLES } from "../constants/roles";

export const downloadOrderInvoicePdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  const { id } = req.params;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order id");

  let order;
  if (role === ROLES.ADMIN || role === ROLES.MASTER_ADMIN) {
    order = await OrderModel.findById(id);
  } else {
    order = await OrderModel.findOne({ _id: id, userId });
  }

  if (!order) throw new ApiError(404, "Order not found");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${order.invoice.invoiceNumber}.pdf"`);

  const doc = buildInvoicePdf(order);
  doc.pipe(res);
});

export const downloadVendorInvoicePdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  const { id, shopId } = req.params;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order id");
  if (!mongoose.Types.ObjectId.isValid(shopId)) throw new ApiError(400, "Invalid shop id");

  const order = await OrderModel.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  const bucket = order.vendorOrders.find((vo: any) => String(vo.shopId) === String(shopId));
  if (!bucket) throw new ApiError(404, "Vendor invoice bucket not found");

  if (
    role !== ROLES.ADMIN &&
    role !== ROLES.MASTER_ADMIN &&
    String(bucket.vendorId) !== String(userId)
  ) {
    throw new ApiError(403, "Forbidden");
  }

  const payload = {
    ...order.toObject(),
    items: bucket.items,
    subtotal: bucket.subtotal,
    shippingTotal: bucket.shippingTotal,
    discountAmount: bucket.discountAmount,
    taxAmount: bucket.taxAmount,
    grandTotal: bucket.grandTotal,
    invoice: {
      invoiceNumber: bucket.invoice.invoiceNumber,
      invoiceDate: bucket.invoice.invoiceDate,
      companyName: bucket.invoice.sellerDisplayName,
      companyAddress: "",
      companyGst: bucket.invoice.sellerTaxId || "",
    },
  };

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${bucket.invoice.invoiceNumber}.pdf"`);

  const doc = buildInvoicePdf(payload);
  doc.pipe(res);
});
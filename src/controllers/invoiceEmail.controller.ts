import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { OrderModel } from "../models/order.model";
import { UserModel } from "../models/user.model";
import { buildInvoicePdfBuffer } from "../utils/pdfInvoice";
import { sendInvoiceEmail } from "../utils/emailInvoice";
import { env } from "../config/env";
import { ROLES } from "../constants/roles";

export const emailOrderInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const role = req.user?.role;
  const userId = req.user?.id;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order id");

  let order;
  if (role === ROLES.ADMIN || role === ROLES.MASTER_ADMIN) {
    order = await OrderModel.findById(id);
  } else {
    order = await OrderModel.findOne({ _id: id, userId });
  }

  if (!order) throw new ApiError(404, "Order not found");

  const user = await UserModel.findById(order.userId);
  if (!user?.email) throw new ApiError(404, "Customer email not found");

  const pdfBuffer = await buildInvoicePdfBuffer(order);

  const result = await sendInvoiceEmail({
    to: user.email,
    subject: `${env.INVOICE_EMAIL_SUBJECT_PREFIX} ${order.invoice.invoiceNumber}`,
    html: `<p>Hello ${user.name || "Customer"},</p><p>Please find your invoice attached for order <b>${order.orderNumber}</b>.</p>`,
    pdfBuffer,
    filename: `${order.invoice.invoiceNumber}.pdf`,
  });

  res.status(200).json(new ApiResponse("Invoice email sent successfully", result));
});
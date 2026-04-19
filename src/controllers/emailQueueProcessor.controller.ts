import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { EventQueueModel } from "../models/eventQueue.model";
import { OrderModel } from "../models/order.model";
import { UserModel } from "../models/user.model";
import { buildInvoicePdfBuffer } from "../utils/pdfInvoice";
import { sendInvoiceEmail } from "../utils/emailInvoice";
import { env } from "../config/env";

export const processEmailQueue = asyncHandler(async (_req: Request, res: Response) => {
  const events = await EventQueueModel.find({
    status: "PENDING",
    eventType: { $in: ["SEND_INVOICE_EMAIL", "SEND_LOW_STOCK_EMAIL", "SEND_REFUND_STATUS", "SEND_PAYOUT_STATUS"] },
  })
    .sort({ createdAt: 1 })
    .limit(20);

  let success = 0;
  let failed = 0;

  for (const event of events) {
    try {
      event.status = "PROCESSING";
      event.attempts += 1;
      await event.save();

      if (event.eventType === "SEND_INVOICE_EMAIL") {
        const orderId = String(event.payload.orderId || "");
        const order = await OrderModel.findById(orderId);
        if (order) {
          const user = await UserModel.findById(order.userId);
          if (user?.email) {
            const pdfBuffer = await buildInvoicePdfBuffer(order);

            await sendInvoiceEmail({
              to: user.email,
              subject: `${env.INVOICE_EMAIL_SUBJECT_PREFIX} ${order.invoice.invoiceNumber}`,
              html: `<p>Your invoice for order <b>${order.orderNumber}</b> is attached.</p>`,
              pdfBuffer,
              filename: `${order.invoice.invoiceNumber}.pdf`,
            });
          }
        }
      }

      event.status = "DONE";
      event.lastError = "";
      await event.save();
      success += 1;
    } catch (error: any) {
      event.status = event.attempts >= event.maxAttempts ? "FAILED" : "PENDING";
      event.lastError = error?.message || "Queue processing failed";
      await event.save();
      failed += 1;
    }
  }

  res.status(200).json(
    new ApiResponse("Email queue processed", {
      success,
      failed,
      processed: events.length,
    })
  );
});
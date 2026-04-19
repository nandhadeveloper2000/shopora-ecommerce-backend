import { Request, Response } from "express";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { verifyRazorpayWebhookSignature } from "../utils/paymentSignature";
import { env } from "../config/env";
import { PaymentModel } from "../models/payment.model";
import { OrderModel } from "../models/order.model";
import { WebhookEventModel } from "../models/webhookEvent.model";
import { WebhookReplayGuardModel } from "../models/webhookReplayGuard.model";
function hashPayload(rawBody: Buffer | string) {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}
const replayHeader = String(req.headers["x-razorpay-event-id"] || "");
const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");
const payloadHash = hashPayload(bodyString);
const replayKey = replayHeader || `${signature}:${payloadHash}`;

try {
  await WebhookReplayGuardModel.create({
    provider: "RAZORPAY",
    replayKey,
    signature,
    payloadHash,
    status: "PROCESSING",
  });
} catch {
  return res.status(200).json({ received: true, duplicate: true });
}
await WebhookReplayGuardModel.updateOne(
  { provider: "RAZORPAY", replayKey },
  { $set: { status: "FAILED" } }
);
export const handleRazorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = String(req.headers["x-razorpay-signature"] || "");
  const rawBody = req.body;

  if (!signature) {
    throw new ApiError(400, "Missing webhook signature");
  }

  const isValid = verifyRazorpayWebhookSignature({
    rawBody,
    signature,
    secret: env.RAZORPAY_WEBHOOK_SECRET,
  });

  if (!isValid) {
    throw new ApiError(400, "Invalid webhook signature");
  }

  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");
  const payload = JSON.parse(bodyString || "{}");
  const eventType = payload.event || "unknown";
  const eventId = payload?.payload?.payment?.entity?.id || payload?.payload?.order?.entity?.id || hashPayload(bodyString);
  const payloadHash = hashPayload(bodyString);

  const existing = await WebhookEventModel.findOne({
    provider: "RAZORPAY",
    eventId,
  });

  if (existing) {
    existing.status = "DUPLICATE";
    await existing.save();
    return res.status(200).json({ received: true, duplicate: true });
  }

  const webhookLog = await WebhookEventModel.create({
    provider: "RAZORPAY",
    eventId,
    eventType,
    signature,
    payloadHash,
    status: "RECEIVED",
  });

  try {
    const paymentEntity = payload?.payload?.payment?.entity || null;
    const orderEntity = payload?.payload?.order?.entity || null;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id || "";

    if (razorpayOrderId) {
      const payment = await PaymentModel.findOne({ razorpayOrderId });
      const order = await OrderModel.findOne({ razorpayOrderId });

      if (payment) {
        payment.webhookEvents = payment.webhookEvents || [];
        payment.webhookEvents.push({
          event: eventType,
          payload,
          receivedAt: new Date(),
        });

        if (eventType === "payment.authorized") payment.status = "AUTHORIZED";
        if (eventType === "payment.captured" || eventType === "order.paid") payment.status = "PAID";
        if (eventType === "payment.failed") payment.status = "FAILED";

        payment.razorpayPaymentId = paymentEntity?.id || payment.razorpayPaymentId;
        payment.rawResponse = payload;
        await payment.save();

        webhookLog.relatedPaymentId = String(payment._id);
      }

      if (order) {
        if (eventType === "payment.authorized") order.paymentStatus = "AUTHORIZED";
        if (eventType === "payment.captured" || eventType === "order.paid") {
          order.paymentStatus = "PAID";
          order.paymentReference = paymentEntity?.id || order.paymentReference;
          order.razorpayPaymentId = paymentEntity?.id || order.razorpayPaymentId;
        }
        if (eventType === "payment.failed") {
          order.paymentStatus = "FAILED";
          order.razorpayPaymentId = paymentEntity?.id || order.razorpayPaymentId;
        }

        order.paymentAttempts = (order.paymentAttempts || []).map((attempt: any) =>
          attempt.razorpayOrderId === razorpayOrderId
            ? {
                ...attempt,
                razorpayPaymentId: paymentEntity?.id || attempt.razorpayPaymentId,
                status:
                  eventType === "payment.authorized"
                    ? "AUTHORIZED"
                    : eventType === "payment.captured" || eventType === "order.paid"
                    ? "PAID"
                    : eventType === "payment.failed"
                    ? "FAILED"
                    : attempt.status,
                updatedAt: new Date(),
                rawResponse: payload,
              }
            : attempt
        );

        await order.save();
        webhookLog.relatedOrderId = String(order._id);
      }
    }

    webhookLog.status = "PROCESSED";
    await webhookLog.save();

    return res.status(200).json({ received: true });
  } catch (error: any) {
    webhookLog.status = "FAILED";
    webhookLog.failureReason = error?.message || "Webhook processing failed";
    await webhookLog.save();
    throw error;
  }
});
import { NotificationModel } from "../models/notification.model";

export async function createNotification(params: {
  userId?: string | null;
  vendorId?: string | null;
  shopId?: string | null;
  audienceType: "USER" | "VENDOR" | "ADMIN" | "SYSTEM";
  title: string;
  message: string;
  channel?: "IN_APP" | "EMAIL";
  eventType: "ORDER" | "RETURN" | "REFUND" | "LOW_STOCK" | "PAYOUT" | "INVOICE" | "SYSTEM";
  meta?: Record<string, unknown>;
}) {
  return NotificationModel.create({
    userId: params.userId || null,
    vendorId: params.vendorId || null,
    shopId: params.shopId || null,
    audienceType: params.audienceType,
    title: params.title,
    message: params.message,
    channel: params.channel || "IN_APP",
    eventType: params.eventType,
    status: "PENDING",
    meta: params.meta || {},
  });
}
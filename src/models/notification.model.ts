import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
  userId?: Types.ObjectId | null;
  vendorId?: Types.ObjectId | null;
  shopId?: Types.ObjectId | null;
  audienceType: "USER" | "VENDOR" | "ADMIN" | "SYSTEM";
  title: string;
  message: string;
  channel: "IN_APP" | "EMAIL";
  eventType:
    | "ORDER"
    | "RETURN"
    | "REFUND"
    | "LOW_STOCK"
    | "PAYOUT"
    | "INVOICE"
    | "SYSTEM";
  status: "PENDING" | "SENT" | "FAILED" | "READ";
  meta?: Record<string, unknown>;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
      index: true,
    },
    audienceType: {
      type: String,
      enum: ["USER", "VENDOR", "ADMIN", "SYSTEM"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ["IN_APP", "EMAIL"],
      default: "IN_APP",
      index: true,
    },
    eventType: {
      type: String,
      enum: ["ORDER", "RETURN", "REFUND", "LOW_STOCK", "PAYOUT", "INVOICE", "SYSTEM"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED", "READ"],
      default: "PENDING",
      index: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const NotificationModel: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
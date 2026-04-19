import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebhookEvent extends Document {
  provider: "RAZORPAY";
  eventId: string;
  eventType: string;
  signature: string;
  payloadHash: string;
  status: "RECEIVED" | "PROCESSED" | "DUPLICATE" | "FAILED";
  failureReason?: string;
  relatedOrderId?: string;
  relatedPaymentId?: string;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    provider: {
      type: String,
      enum: ["RAZORPAY"],
      default: "RAZORPAY",
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    signature: {
      type: String,
      required: true,
      trim: true,
    },
    payloadHash: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["RECEIVED", "PROCESSED", "DUPLICATE", "FAILED"],
      default: "RECEIVED",
      index: true,
    },
    failureReason: {
      type: String,
      default: "",
      trim: true,
    },
    relatedOrderId: {
      type: String,
      default: "",
      trim: true,
    },
    relatedPaymentId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export const WebhookEventModel: Model<IWebhookEvent> = mongoose.model<IWebhookEvent>(
  "WebhookEvent",
  webhookEventSchema
);
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebhookReplayGuard extends Document {
  provider: "RAZORPAY";
  replayKey: string;
  signature: string;
  payloadHash: string;
  status: "PROCESSING" | "DONE" | "FAILED";
}

const webhookReplayGuardSchema = new Schema<IWebhookReplayGuard>(
  {
    provider: {
      type: String,
      enum: ["RAZORPAY"],
      default: "RAZORPAY",
      index: true,
    },
    replayKey: {
      type: String,
      required: true,
      trim: true,
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
      enum: ["PROCESSING", "DONE", "FAILED"],
      default: "PROCESSING",
      index: true,
    },
  },
  { timestamps: true }
);

webhookReplayGuardSchema.index({ provider: 1, replayKey: 1 }, { unique: true });

export const WebhookReplayGuardModel: Model<IWebhookReplayGuard> = mongoose.model(
  "WebhookReplayGuard",
  webhookReplayGuardSchema
);
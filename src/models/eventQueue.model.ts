import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEventQueue extends Document {
  eventType:
    | "SEND_INVOICE_EMAIL"
    | "SEND_LOW_STOCK_EMAIL"
    | "SEND_SETTLEMENT_REMINDER"
    | "SEND_PAYOUT_STATUS"
    | "SEND_REFUND_STATUS";
  payload: Record<string, unknown>;
  status: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  nextRunAt?: Date | null;
}

const eventQueueSchema = new Schema<IEventQueue>(
  {
    eventType: {
      type: String,
      enum: [
        "SEND_INVOICE_EMAIL",
        "SEND_LOW_STOCK_EMAIL",
        "SEND_SETTLEMENT_REMINDER",
        "SEND_PAYOUT_STATUS",
        "SEND_REFUND_STATUS",
      ],
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "DONE", "FAILED"],
      default: "PENDING",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },
    lastError: {
      type: String,
      default: "",
      trim: true,
    },
    nextRunAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export const EventQueueModel: Model<IEventQueue> = mongoose.model<IEventQueue>(
  "EventQueue",
  eventQueueSchema
);
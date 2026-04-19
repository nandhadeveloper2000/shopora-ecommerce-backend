import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  gateway: "RAZORPAY";
  currency: string;
  amount: number;
  amountSubunits: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: "CREATED" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";
  rawResponse?: Record<string, unknown>;
  webhookEvents?: Array<{
    event: string;
    payload: Record<string, unknown>;
    receivedAt: Date;
  }>;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ["RAZORPAY"],
      default: "RAZORPAY",
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountSubunits: {
      type: Number,
      required: true,
      min: 0,
    },
    razorpayOrderId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["CREATED", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "CANCELLED"],
      default: "CREATED",
      index: true,
    },
    rawResponse: {
      type: Schema.Types.Mixed,
      default: {},
    },
    webhookEvents: {
      type: [
        {
          event: { type: String, required: true },
          payload: { type: Schema.Types.Mixed, default: {} },
          receivedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const PaymentModel: Model<IPayment> = mongoose.model<IPayment>("Payment", paymentSchema);
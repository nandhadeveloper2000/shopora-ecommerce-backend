import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IRefundRequest extends Document {
  orderId: Types.ObjectId;
  returnRequestId?: Types.ObjectId | null;
  userId: Types.ObjectId;
  shopId: Types.ObjectId;
  vendorId: Types.ObjectId;
  amount: number;
  reason: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "PROCESSED";
  mode: "ORIGINAL_PAYMENT" | "MANUAL";
  note?: string;
}

const refundRequestSchema = new Schema<IRefundRequest>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    returnRequestId: { type: Schema.Types.ObjectId, ref: "ReturnRequest", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "PROCESSED"],
      default: "REQUESTED",
      index: true,
    },
    mode: {
      type: String,
      enum: ["ORIGINAL_PAYMENT", "MANUAL"],
      default: "ORIGINAL_PAYMENT",
    },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const RefundRequestModel: Model<IRefundRequest> = mongoose.model<IRefundRequest>(
  "RefundRequest",
  refundRequestSchema
);
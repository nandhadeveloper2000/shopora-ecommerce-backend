import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReturnRequest extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  shopId: Types.ObjectId;
  vendorId: Types.ObjectId;
  items: Array<{
    vendorListingId: Types.ObjectId;
    quantity: number;
    reason: string;
  }>;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "RECEIVED" | "REFUNDED";
  note?: string;
}

const returnRequestSchema = new Schema<IReturnRequest>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: {
      type: [
        {
          vendorListingId: { type: Schema.Types.ObjectId, ref: "VendorListing", required: true },
          quantity: { type: Number, required: true, min: 1 },
          reason: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"],
      default: "REQUESTED",
      index: true,
    },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const ReturnRequestModel: Model<IReturnRequest> = mongoose.model<IReturnRequest>(
  "ReturnRequest",
  returnRequestSchema
);
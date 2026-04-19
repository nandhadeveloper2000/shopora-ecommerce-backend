import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISettlementLedger extends Document {
  orderId: Types.ObjectId;
  shopId: Types.ObjectId;
  vendorId: Types.ObjectId;
  grossAmount: number;
  shippingAmount: number;
  taxAmount: number;
  discountShare: number;
  platformFee: number;
  gatewayFee: number;
  netPayable: number;
  settlementStatus: "PENDING" | "READY" | "PAID" | "ON_HOLD";
  payoutReference?: string;
  payoutDate?: Date | null;
}

const settlementLedgerSchema = new Schema<ISettlementLedger>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    grossAmount: { type: Number, required: true, min: 0 },
    shippingAmount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    discountShare: { type: Number, required: true, min: 0, default: 0 },
    platformFee: { type: Number, required: true, min: 0, default: 0 },
    gatewayFee: { type: Number, required: true, min: 0, default: 0 },
    netPayable: { type: Number, required: true, min: 0 },
    settlementStatus: {
      type: String,
      enum: ["PENDING", "READY", "PAID", "ON_HOLD"],
      default: "PENDING",
      index: true,
    },
    payoutReference: { type: String, default: "", trim: true },
    payoutDate: { type: Date, default: null },
  },
  { timestamps: true }
);

settlementLedgerSchema.index({ vendorId: 1, settlementStatus: 1, createdAt: -1 });

export const SettlementLedgerModel: Model<ISettlementLedger> = mongoose.model<ISettlementLedger>(
  "SettlementLedger",
  settlementLedgerSchema
);
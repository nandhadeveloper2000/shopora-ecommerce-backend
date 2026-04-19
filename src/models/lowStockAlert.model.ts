import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILowStockAlert extends Document {
  vendorListingId: Types.ObjectId;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  stockLocationId?: Types.ObjectId | null;
  currentQty: number;
  thresholdQty: number;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
}

const lowStockAlertSchema = new Schema<ILowStockAlert>(
  {
    vendorListingId: {
      type: Schema.Types.ObjectId,
      ref: "VendorListing",
      required: true,
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    stockLocationId: {
      type: Schema.Types.ObjectId,
      ref: "StockLocation",
      default: null,
    },
    currentQty: {
      type: Number,
      required: true,
      min: 0,
    },
    thresholdQty: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED"],
      default: "OPEN",
      index: true,
    },
  },
  { timestamps: true }
);

export const LowStockAlertModel: Model<ILowStockAlert> = mongoose.model<ILowStockAlert>(
  "LowStockAlert",
  lowStockAlertSchema
);
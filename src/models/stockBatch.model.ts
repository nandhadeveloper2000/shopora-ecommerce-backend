import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStockBatch extends Document {
  vendorListingId: Types.ObjectId;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  stockLocationId?: Types.ObjectId | null;
  batchNumber: string;
  mfgDate?: Date | null;
  expiryDate?: Date | null;
  inwardQty: number;
  availableQty: number;
  unitCost: number;
  sourceType: "GRN" | "MANUAL" | "TRANSFER";
  sourceId?: Types.ObjectId | null;
  status: "ACTIVE" | "EXPIRED" | "DEPLETED";
}

const stockBatchSchema = new Schema<IStockBatch>(
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
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    mfgDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },
    inwardQty: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQty: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    sourceType: {
      type: String,
      enum: ["GRN", "MANUAL", "TRANSFER"],
      required: true,
    },
    sourceId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "DEPLETED"],
      default: "ACTIVE",
      index: true,
    },
  },
  { timestamps: true }
);

stockBatchSchema.index(
  {
    vendorListingId: 1,
    warehouseId: 1,
    stockLocationId: 1,
    batchNumber: 1,
  },
  { unique: true }
);

export const StockBatchModel: Model<IStockBatch> = mongoose.model<IStockBatch>(
  "StockBatch",
  stockBatchSchema
);
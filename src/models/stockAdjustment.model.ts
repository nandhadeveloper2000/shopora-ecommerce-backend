import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStockAdjustmentItem {
  vendorListingId: Types.ObjectId;
  quantity: number;
}

export interface IStockAdjustment extends Document {
  adjustmentNumber: string;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  stockLocationId?: Types.ObjectId | null;
  reasonType: "DAMAGED" | "EXPIRED" | "SHRINKAGE" | "CORRECTION";
  items: IStockAdjustmentItem[];
  note?: string;
}

const stockAdjustmentItemSchema = new Schema<IStockAdjustmentItem>(
  {
    vendorListingId: {
      type: Schema.Types.ObjectId,
      ref: "VendorListing",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const stockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    adjustmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    reasonType: {
      type: String,
      enum: ["DAMAGED", "EXPIRED", "SHRINKAGE", "CORRECTION"],
      required: true,
      index: true,
    },
    items: {
      type: [stockAdjustmentItemSchema],
      default: [],
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export const StockAdjustmentModel: Model<IStockAdjustment> = mongoose.model<IStockAdjustment>(
  "StockAdjustment",
  stockAdjustmentSchema
);
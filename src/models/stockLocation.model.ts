import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStockLocation extends Document {
  warehouseId: Types.ObjectId;
  name: string;
  code: string;
  type: "BIN" | "RACK" | "SHELF" | "STAGING";
  isActive: boolean;
}

const stockLocationSchema = new Schema<IStockLocation>(
  {
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["BIN", "RACK", "SHELF", "STAGING"],
      default: "BIN",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

stockLocationSchema.index({ warehouseId: 1, code: 1 }, { unique: true });

export const StockLocationModel: Model<IStockLocation> = mongoose.model<IStockLocation>(
  "StockLocation",
  stockLocationSchema
);
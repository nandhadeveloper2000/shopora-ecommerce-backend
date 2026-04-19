import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStockTransferItem {
  vendorListingId: Types.ObjectId;
  quantity: number;
}

export interface IStockTransfer extends Document {
  transferNumber: string;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  fromWarehouseId: Types.ObjectId;
  fromStockLocationId?: Types.ObjectId | null;
  toWarehouseId: Types.ObjectId;
  toStockLocationId?: Types.ObjectId | null;
  items: IStockTransferItem[];
  status: "DRAFT" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  note?: string;
}

const stockTransferItemSchema = new Schema<IStockTransferItem>(
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

const stockTransferSchema = new Schema<IStockTransfer>(
  {
    transferNumber: {
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
    fromWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    fromStockLocationId: {
      type: Schema.Types.ObjectId,
      ref: "StockLocation",
      default: null,
    },
    toWarehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
      index: true,
    },
    toStockLocationId: {
      type: Schema.Types.ObjectId,
      ref: "StockLocation",
      default: null,
    },
    items: {
      type: [stockTransferItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["DRAFT", "IN_TRANSIT", "COMPLETED", "CANCELLED"],
      default: "DRAFT",
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export const StockTransferModel: Model<IStockTransfer> = mongoose.model<IStockTransfer>(
  "StockTransfer",
  stockTransferSchema
);
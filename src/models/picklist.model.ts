import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPicklistItem {
  warehouseAllocationId: Types.ObjectId;
  vendorListingId: Types.ObjectId;
  batchId?: Types.ObjectId | null;
  requestedQty: number;
  pickedQty: number;
}

export interface IPicklist extends Document {
  picklistNumber: string;
  orderId: Types.ObjectId;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  stockLocationId?: Types.ObjectId | null;
  items: IPicklistItem[];
  status: "CREATED" | "PICKING" | "PICKED" | "CANCELLED";
  pickerName?: string;
  note?: string;
}

const picklistItemSchema = new Schema<IPicklistItem>(
  {
    warehouseAllocationId: {
      type: Schema.Types.ObjectId,
      ref: "WarehouseAllocation",
      required: true,
    },
    vendorListingId: {
      type: Schema.Types.ObjectId,
      ref: "VendorListing",
      required: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "StockBatch",
      default: null,
    },
    requestedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    pickedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const picklistSchema = new Schema<IPicklist>(
  {
    picklistNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
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
    items: {
      type: [picklistItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["CREATED", "PICKING", "PICKED", "CANCELLED"],
      default: "CREATED",
      index: true,
    },
    pickerName: {
      type: String,
      default: "",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export const PicklistModel: Model<IPicklist> = mongoose.model<IPicklist>(
  "Picklist",
  picklistSchema
);
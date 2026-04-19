import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IGrnItem {
  vendorListingId: Types.ObjectId;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unitCost: number;
  batchNumber?: string;
  mfgDate?: Date | null;
  expiryDate?: Date | null;
}

export interface IGrn extends Document {
  grnNumber: string;
  purchaseOrderId?: Types.ObjectId | null;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  stockLocationId?: Types.ObjectId | null;
  items: IGrnItem[];
  note?: string;
}

const grnItemSchema = new Schema<IGrnItem>(
  {
    vendorListingId: {
      type: Schema.Types.ObjectId,
      ref: "VendorListing",
      required: true,
    },
    receivedQty: {
      type: Number,
      required: true,
      min: 0,
    },
    acceptedQty: {
      type: Number,
      required: true,
      min: 0,
    },
    rejectedQty: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    batchNumber: {
      type: String,
      default: "",
      trim: true,
    },
    mfgDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const grnSchema = new Schema<IGrn>(
  {
    grnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    purchaseOrderId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      default: null,
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
      type: [grnItemSchema],
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

export const GrnModel: Model<IGrn> = mongoose.model<IGrn>("Grn", grnSchema);
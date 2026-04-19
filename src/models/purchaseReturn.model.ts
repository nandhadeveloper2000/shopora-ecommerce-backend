import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPurchaseReturnItem {
  vendorListingId: Types.ObjectId;
  quantity: number;
  unitCost: number;
  reason: string;
}

export interface IPurchaseReturn extends Document {
  returnNumber: string;
  purchaseOrderId?: Types.ObjectId | null;
  supplierName: string;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  items: IPurchaseReturnItem[];
  totalAmount: number;
  status: "DRAFT" | "RETURNED" | "CANCELLED";
  note?: string;
}

const purchaseReturnItemSchema = new Schema<IPurchaseReturnItem>(
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
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const purchaseReturnSchema = new Schema<IPurchaseReturn>(
  {
    returnNumber: {
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
    supplierName: {
      type: String,
      required: true,
      trim: true,
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
    items: {
      type: [purchaseReturnItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["DRAFT", "RETURNED", "CANCELLED"],
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

export const PurchaseReturnModel: Model<IPurchaseReturn> = mongoose.model<IPurchaseReturn>(
  "PurchaseReturn",
  purchaseReturnSchema
);
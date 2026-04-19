import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPurchaseOrderItem {
  vendorListingId: Types.ObjectId;
  quantity: number;
  receivedQty: number;
  pendingQty: number;
  unitCost: number;
  taxPercent: number;
  lineTotal: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  supplierName: string;
  supplierMobile?: string;
  supplierEmail?: string;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  items: IPurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: "DRAFT" | "ORDERED" | "PART_RECEIVED" | "RECEIVED" | "CANCELLED";
  note?: string;
}

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
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
    receivedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingQty: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    supplierMobile: {
      type: String,
      default: "",
      trim: true,
    },
    supplierEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
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
      type: [purchaseOrderItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ORDERED", "PART_RECEIVED", "RECEIVED", "CANCELLED"],
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

export const PurchaseOrderModel: Model<IPurchaseOrder> = mongoose.model<IPurchaseOrder>(
  "PurchaseOrder",
  purchaseOrderSchema
);
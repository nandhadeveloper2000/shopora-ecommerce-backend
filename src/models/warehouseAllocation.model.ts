import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWarehouseAllocation extends Document {
  orderId: Types.ObjectId;
  vendorListingId: Types.ObjectId;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  stockLocationId?: Types.ObjectId | null;
  allocatedQty: number;
  pickedQty: number;
  packedQty: number;
  shippedQty: number;
  status: "ALLOCATED" | "PICKED" | "PACKED" | "SHIPPED" | "CANCELLED";
}

const warehouseAllocationSchema = new Schema<IWarehouseAllocation>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
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
    allocatedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    pickedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    packedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ALLOCATED", "PICKED", "PACKED", "SHIPPED", "CANCELLED"],
      default: "ALLOCATED",
      index: true,
    },
  },
  { timestamps: true }
);

export const WarehouseAllocationModel: Model<IWarehouseAllocation> = mongoose.model(
  "WarehouseAllocation",
  warehouseAllocationSchema
);
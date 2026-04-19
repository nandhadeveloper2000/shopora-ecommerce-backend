import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IInventoryBalance extends Document {
  vendorListingId: Types.ObjectId;
  masterProductId: Types.ObjectId;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  stockLocationId?: Types.ObjectId | null;
  quantityOnHand: number;
  reservedQty: number;
  availableQty: number;
  reorderLevel: number;
  lowStockThreshold: number;
}

const inventoryBalanceSchema = new Schema<IInventoryBalance>(
  {
    vendorListingId: {
      type: Schema.Types.ObjectId,
      ref: "VendorListing",
      required: true,
      index: true,
    },
    masterProductId: {
      type: Schema.Types.ObjectId,
      ref: "MasterProduct",
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
      index: true,
    },
    quantityOnHand: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 3,
      min: 0,
    },
  },
  { timestamps: true }
);

inventoryBalanceSchema.index(
  {
    vendorListingId: 1,
    warehouseId: 1,
    stockLocationId: 1,
  },
  { unique: true }
);

export const InventoryBalanceModel: Model<IInventoryBalance> = mongoose.model<IInventoryBalance>(
  "InventoryBalance",
  inventoryBalanceSchema
);
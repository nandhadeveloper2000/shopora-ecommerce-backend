import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IInventoryReservation extends Document {
  orderId: Types.ObjectId;
  vendorListingId: Types.ObjectId;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  stockLocationId?: Types.ObjectId | null;
  reservedQty: number;
  status: "ACTIVE" | "RELEASED" | "CONSUMED" | "CANCELLED";
  note?: string;
}

const inventoryReservationSchema = new Schema<IInventoryReservation>(
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
    reservedQty: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RELEASED", "CONSUMED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export const InventoryReservationModel: Model<IInventoryReservation> = mongoose.model(
  "InventoryReservation",
  inventoryReservationSchema
);
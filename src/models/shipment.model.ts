import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IShipment extends Document {
  shipmentNumber: string;
  orderId: Types.ObjectId;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  packingId: Types.ObjectId;
  courierName?: string;
  awbNumber?: string;
  trackingUrl?: string;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  status: "CREATED" | "SHIPPED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  note?: string;
}

const shipmentSchema = new Schema<IShipment>(
  {
    shipmentNumber: {
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
    packingId: {
      type: Schema.Types.ObjectId,
      ref: "Packing",
      required: true,
    },
    courierName: {
      type: String,
      default: "",
      trim: true,
    },
    awbNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    trackingUrl: {
      type: String,
      default: "",
      trim: true,
    },
    shippedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["CREATED", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
      default: "CREATED",
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

export const ShipmentModel: Model<IShipment> = mongoose.model<IShipment>(
  "Shipment",
  shipmentSchema
);
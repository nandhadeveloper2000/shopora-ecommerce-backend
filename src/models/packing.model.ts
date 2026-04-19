import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPackingItem {
  picklistId: Types.ObjectId;
  vendorListingId: Types.ObjectId;
  packedQty: number;
}

export interface IPacking extends Document {
  packingNumber: string;
  orderId: Types.ObjectId;
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  items: IPackingItem[];
  packageCount: number;
  status: "CREATED" | "PACKED" | "CANCELLED";
  packedBy?: string;
  note?: string;
}

const packingItemSchema = new Schema<IPackingItem>(
  {
    picklistId: {
      type: Schema.Types.ObjectId,
      ref: "Picklist",
      required: true,
    },
    vendorListingId: {
      type: Schema.Types.ObjectId,
      ref: "VendorListing",
      required: true,
    },
    packedQty: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const packingSchema = new Schema<IPacking>(
  {
    packingNumber: {
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
    items: {
      type: [packingItemSchema],
      default: [],
    },
    packageCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["CREATED", "PACKED", "CANCELLED"],
      default: "CREATED",
      index: true,
    },
    packedBy: {
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

export const PackingModel: Model<IPacking> = mongoose.model<IPacking>(
  "Packing",
  packingSchema
);
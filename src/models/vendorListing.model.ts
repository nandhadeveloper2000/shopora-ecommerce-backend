import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface IListingImage {
  url: string;
  publicId?: string;
}

export interface IVendorListing extends Document {
  shopId: Types.ObjectId;
  vendorId: Types.ObjectId;
  masterProductId: Types.ObjectId;
  sellingPrice: number;
  mrp: number;
  stock: number;
  minOrderQty: number;
  images: IListingImage[];
  isActive: boolean;
  isApproved: boolean;
  offerText?: string;
  shippingCharge?: number;
  estimatedDeliveryDays?: number;
}

const listingImageSchema = new Schema<IListingImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
  },
  { _id: false }
);

const vendorListingSchema = new Schema<IVendorListing>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    masterProductId: {
      type: Schema.Types.ObjectId,
      ref: "MasterProduct",
      required: true,
      index: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      index: true,
    },
    minOrderQty: {
      type: Number,
      default: 1,
      min: 1,
    },
    images: {
      type: [listingImageSchema],
      default: [],
    },
    offerText: {
      type: String,
      default: "",
      trim: true,
    },
    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedDeliveryDays: {
      type: Number,
      default: 3,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

vendorListingSchema.index({ shopId: 1, masterProductId: 1 }, { unique: true });
vendorListingSchema.index({
  masterProductId: 1,
  isApproved: 1,
  isActive: 1,
  stock: 1,
  sellingPrice: 1,
});

export const VendorListingModel: Model<IVendorListing> =
  mongoose.model<IVendorListing>("VendorListing", vendorListingSchema);
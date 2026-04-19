import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAddress extends Document {
  userId: Types.ObjectId;
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: "HOME" | "WORK" | "OTHER";
  isDefault: boolean;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    alternateMobile: {
      type: String,
      default: "",
      trim: true,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine2: {
      type: String,
      default: "",
      trim: true,
    },
    landmark: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: "India",
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    addressType: {
      type: String,
      enum: ["HOME", "WORK", "OTHER"],
      default: "HOME",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

addressSchema.index({ userId: 1, isDefault: 1 });

export const AddressModel: Model<IAddress> = mongoose.model<IAddress>(
  "Address",
  addressSchema
);
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IShop extends Document {
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  logo?: string;
  logoPublicId?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
}

const shopSchema = new Schema<IShop>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    logo: {
      type: String,
      default: "",
    },
    logoPublicId: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const ShopModel: Model<IShop> = mongoose.model<IShop>("Shop", shopSchema);
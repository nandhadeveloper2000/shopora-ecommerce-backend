import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICartItem {
  vendorListingId: Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
}

const cartItemSchema = new Schema<ICartItem>(
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
      default: 1,
    },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const CartModel: Model<ICart> = mongoose.model<ICart>("Cart", cartSchema);
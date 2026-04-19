import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IWishlistItem {
  masterProductId: Types.ObjectId;
}

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  items: IWishlistItem[];
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    masterProductId: {
      type: Schema.Types.ObjectId,
      ref: "MasterProduct",
      required: true,
    },
  },
  { _id: false }
);

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [wishlistItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const WishlistModel: Model<IWishlist> = mongoose.model<IWishlist>(
  "Wishlist",
  wishlistSchema
);
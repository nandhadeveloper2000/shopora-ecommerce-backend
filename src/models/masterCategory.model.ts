import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMasterCategory extends Document {
  name: string;
  slug: string;
  isActive: boolean;
}

const masterCategorySchema = new Schema<IMasterCategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const MasterCategoryModel: Model<IMasterCategory> =
  mongoose.model<IMasterCategory>("MasterCategory", masterCategorySchema);
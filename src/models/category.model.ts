import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  masterCategoryId: Types.ObjectId;
  isActive: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    masterCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "MasterCategory",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

categorySchema.index({ masterCategoryId: 1, slug: 1 }, { unique: true });

export const CategoryModel: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  categorySchema
);
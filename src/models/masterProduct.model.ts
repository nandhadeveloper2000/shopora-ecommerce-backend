import mongoose, { Schema, Document, Model, Types } from "mongoose";

interface IMasterProductImage {
  url: string;
  publicId?: string;
}

interface IProductSpec {
  label: string;
  value: string;
}

export interface IMasterProduct extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  masterCategoryId: Types.ObjectId;
  categoryId: Types.ObjectId;
  brandId: Types.ObjectId;
  taxClassId?: Types.ObjectId;
  hsnCode?: string;
  modelName?: string;
  skuCode: string;
  images: IMasterProductImage[];
  specs: IProductSpec[];
  tags: string[];
  isActive: boolean;
}

const productImageSchema = new Schema<IMasterProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
  },
  { _id: false }
);

const productSpecSchema = new Schema<IProductSpec>(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const masterProductSchema = new Schema<IMasterProduct>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    shortDescription: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    masterCategoryId: { type: Schema.Types.ObjectId, ref: "MasterCategory", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    taxClassId: { type: Schema.Types.ObjectId, ref: "TaxClass", default: null },
    hsnCode: { type: String, default: "", trim: true },
    modelName: { type: String, default: "", trim: true },
    skuCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    images: { type: [productImageSchema], default: [] },
    specs: { type: [productSpecSchema], default: [] },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

masterProductSchema.index({ title: "text", description: "text", tags: "text" });

export const MasterProductModel: Model<IMasterProduct> = mongoose.model<IMasterProduct>(
  "MasterProduct",
  masterProductSchema
);
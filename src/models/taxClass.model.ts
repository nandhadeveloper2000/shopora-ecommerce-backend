import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITaxClass extends Document {
  name: string;
  code: string;
  taxType: "GST";
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  isActive: boolean;
  notes?: string;
}

const taxClassSchema = new Schema<ITaxClass>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    taxType: {
      type: String,
      enum: ["GST"],
      default: "GST",
    },
    cgstRate: {
      type: Number,
      required: true,
      min: 0,
    },
    sgstRate: {
      type: Number,
      required: true,
      min: 0,
    },
    igstRate: {
      type: Number,
      required: true,
      min: 0,
    },
    cessRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export const TaxClassModel: Model<ITaxClass> = mongoose.model<ITaxClass>(
  "TaxClass",
  taxClassSchema
);
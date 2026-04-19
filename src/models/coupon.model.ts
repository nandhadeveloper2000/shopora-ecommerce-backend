import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type CouponDiscountType = "PERCENTAGE" | "FLAT";

export interface ICoupon extends Document {
  code: string;
  title: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  totalUsageLimit: number;
  perUserUsageLimit: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableUserIds?: Types.ObjectId[];
  applicableCategoryIds?: Types.ObjectId[];
  applicableBrandIds?: Types.ObjectId[];
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalUsageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    perUserUsageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    applicableUserIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    applicableCategoryIds: {
      type: [Schema.Types.ObjectId],
      ref: "Category",
      default: [],
    },
    applicableBrandIds: {
      type: [Schema.Types.ObjectId],
      ref: "Brand",
      default: [],
    },
  },
  { timestamps: true }
);

export const CouponModel: Model<ICoupon> = mongoose.model<ICoupon>("Coupon", couponSchema);
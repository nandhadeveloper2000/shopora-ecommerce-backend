import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IVendorFundAccount extends Document {
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  accountHolderName: string;
  ifsc: string;
  accountNumber: string;
  accountType: "bank_account";
  razorpayxContactId?: string;
  razorpayxFundAccountId?: string;
  submissionStatus: "SUBMITTED" | "APPROVED" | "REJECTED";
  verificationNote?: string;
  submittedByVendor: boolean;
  isActive: boolean;
}

const vendorFundAccountSchema = new Schema<IVendorFundAccount>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    ifsc: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ["bank_account"],
      default: "bank_account",
    },
    razorpayxContactId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    razorpayxFundAccountId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    submissionStatus: {
      type: String,
      enum: ["SUBMITTED", "APPROVED", "REJECTED"],
      default: "SUBMITTED",
      index: true,
    },
    verificationNote: {
      type: String,
      default: "",
      trim: true,
    },
    submittedByVendor: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

vendorFundAccountSchema.index({ vendorId: 1, shopId: 1 }, { unique: true });

export const VendorFundAccountModel: Model<IVendorFundAccount> = mongoose.model(
  "VendorFundAccount",
  vendorFundAccountSchema
);
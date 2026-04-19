import mongoose, { Schema, Document, Model } from "mongoose";
import { ROLES, UserRole } from "../constants/roles";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  mobile?: string;
  isActive: boolean;
  verifyEmail: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER,
    },
    mobile: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verifyEmail: {
      type: Boolean,
      default: false,
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

export const UserModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);
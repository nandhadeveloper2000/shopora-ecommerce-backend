import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICreditNote extends Document {
  creditNoteNumber: string;
  orderId: Types.ObjectId;
  refundRequestId?: Types.ObjectId | null;
  userId: Types.ObjectId;
  amount: number;
  reason: string;
  status: "ISSUED" | "VOID";
}

const creditNoteSchema = new Schema<ICreditNote>(
  {
    creditNoteNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    refundRequestId: {
      type: Schema.Types.ObjectId,
      ref: "RefundRequest",
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ISSUED", "VOID"],
      default: "ISSUED",
      index: true,
    },
  },
  { timestamps: true }
);

export const CreditNoteModel: Model<ICreditNote> = mongoose.model<ICreditNote>(
  "CreditNote",
  creditNoteSchema
);
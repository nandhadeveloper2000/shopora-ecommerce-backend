import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvoiceSequence extends Document {
  sequenceType: "ORDER_INVOICE" | "VENDOR_INVOICE" | "PO" | "GRN";
  financialYear: string;
  currentNumber: number;
}

const invoiceSequenceSchema = new Schema<IInvoiceSequence>(
  {
    sequenceType: {
      type: String,
      enum: ["ORDER_INVOICE", "VENDOR_INVOICE", "PO", "GRN"],
      required: true,
    },
    financialYear: {
      type: String,
      required: true,
      trim: true,
    },
    currentNumber: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

invoiceSequenceSchema.index({ sequenceType: 1, financialYear: 1 }, { unique: true });

export const InvoiceSequenceModel: Model<IInvoiceSequence> = mongoose.model<IInvoiceSequence>(
  "InvoiceSequence",
  invoiceSequenceSchema
);
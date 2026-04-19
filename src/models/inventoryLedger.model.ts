import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IInventoryLedger extends Document {
  vendorListingId: Types.ObjectId;
  masterProductId: Types.ObjectId;
  shopId: Types.ObjectId;
  vendorId: Types.ObjectId;
  movementType:
    | "OPENING"
    | "MANUAL_ADD"
    | "MANUAL_REMOVE"
    | "ORDER_RESERVE"
    | "ORDER_CANCEL_RESTORE"
    | "RETURN_RESTORE"
    | "REFUND_RESTORE";
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  referenceType?: "ORDER" | "RETURN_REQUEST" | "REFUND_REQUEST" | "ADMIN" | "SYSTEM";
  referenceId?: Types.ObjectId | null;
  note?: string;
}

const inventoryLedgerSchema = new Schema<IInventoryLedger>(
  {
    vendorListingId: { type: Schema.Types.ObjectId, ref: "VendorListing", required: true, index: true },
    masterProductId: { type: Schema.Types.ObjectId, ref: "MasterProduct", required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    movementType: {
      type: String,
      enum: [
        "OPENING",
        "MANUAL_ADD",
        "MANUAL_REMOVE",
        "ORDER_RESERVE",
        "ORDER_CANCEL_RESTORE",
        "RETURN_RESTORE",
        "REFUND_RESTORE",
      ],
      required: true,
      index: true,
    },
    quantityDelta: { type: Number, required: true },
    stockBefore: { type: Number, required: true, min: 0 },
    stockAfter: { type: Number, required: true, min: 0 },
    referenceType: {
      type: String,
      enum: ["ORDER", "RETURN_REQUEST", "REFUND_REQUEST", "ADMIN", "SYSTEM"],
      default: "SYSTEM",
    },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const InventoryLedgerModel: Model<IInventoryLedger> = mongoose.model<IInventoryLedger>(
  "InventoryLedger",
  inventoryLedgerSchema
);
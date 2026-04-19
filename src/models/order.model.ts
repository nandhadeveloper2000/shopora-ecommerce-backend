import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PaymentMethod = "COD" | "ONLINE";
export type PaymentStatus =
  | "PENDING"
  | "CREATED"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "PARTIALLY_CANCELLED"
  | "CANCELLED";

interface IAddressSnapshot {
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: "HOME" | "WORK" | "OTHER";
}

interface IProductSnapshot {
  masterProductId: Types.ObjectId;
  vendorListingId: Types.ObjectId;
  productTitle: string;
  productSlug: string;
  skuCode: string;
  modelName?: string;
  productImage?: string;
  brandName?: string;
  categoryName?: string;
  shopName?: string;
}

interface IOrderItem {
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  masterProductId: Types.ObjectId;
  vendorListingId: Types.ObjectId;
  quantity: number;
  price: number;
  mrp: number;
  shippingCharge: number;
  itemSubtotal: number;
  itemShippingTotal: number;
  itemDiscountAmount: number;
  itemTaxAmount: number;
  itemGrandTotal: number;
  productSnapshot: IProductSnapshot;
  status: OrderStatus;
  isCancelled: boolean;
  cancelledAt?: Date | null;
}

interface IVendorInvoiceInfo {
  invoiceNumber: string;
  invoiceDate: Date | null;
  sellerDisplayName: string;
  sellerTaxId?: string;
}

interface IVendorOrder {
  vendorId: Types.ObjectId;
  shopId: Types.ObjectId;
  items: IOrderItem[];
  totalItems: number;
  subtotal: number;
  shippingTotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  status: OrderStatus;
  isCancelled: boolean;
  cancelledAt?: Date | null;
  invoice: IVendorInvoiceInfo;
}

interface IInvoiceInfo {
  invoiceNumber: string;
  invoiceDate: Date | null;
  companyName: string;
  companyAddress?: string;
  companyGst?: string;
}

interface IPaymentAttempt {
  gateway: "RAZORPAY";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  amountSubunits: number;
  currency: string;
  status: "CREATED" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
  rawResponse?: Record<string, unknown>;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: Types.ObjectId;
  addressId?: Types.ObjectId;
  addressSnapshot: IAddressSnapshot;
  billingAddressSnapshot: IAddressSnapshot;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  couponCode?: string;
  couponId?: Types.ObjectId | null;
  couponSnapshot?: {
    code: string;
    title?: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    maxDiscountAmount?: number;
  } | null;
  discountAmount: number;
  taxAmount: number;
  totalItems: number;
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
  status: OrderStatus;
  items: IOrderItem[];
  vendorOrders: IVendorOrder[];
  paymentAttempts: IPaymentAttempt[];
  invoice: IInvoiceInfo;
  cancelledAt?: Date | null;
  cancellationReason?: string;
}

const addressSnapshotSchema = new Schema<IAddressSnapshot>(
  {
    fullName: { type: String, required: true },
    mobile: { type: String, required: true },
    alternateMobile: { type: String, default: "" },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    landmark: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    addressType: {
      type: String,
      enum: ["HOME", "WORK", "OTHER"],
      default: "HOME",
    },
  },
  { _id: false }
);

const productSnapshotSchema = new Schema<IProductSnapshot>(
  {
    masterProductId: { type: Schema.Types.ObjectId, ref: "MasterProduct", required: true },
    vendorListingId: { type: Schema.Types.ObjectId, ref: "VendorListing", required: true },
    productTitle: { type: String, required: true },
    productSlug: { type: String, required: true },
    skuCode: { type: String, required: true },
    modelName: { type: String, default: "" },
    productImage: { type: String, default: "" },
    brandName: { type: String, default: "" },
    categoryName: { type: String, default: "" },
    shopName: { type: String, default: "" },
  },
  { _id: false }
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    masterProductId: { type: Schema.Types.ObjectId, ref: "MasterProduct", required: true },
    vendorListingId: { type: Schema.Types.ObjectId, ref: "VendorListing", required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, required: true, min: 0, default: 0 },
    itemSubtotal: { type: Number, required: true, min: 0 },
    itemShippingTotal: { type: Number, required: true, min: 0 },
    itemDiscountAmount: { type: Number, required: true, min: 0, default: 0 },
    itemTaxAmount: { type: Number, required: true, min: 0, default: 0 },
    itemGrandTotal: { type: Number, required: true, min: 0 },
    productSnapshot: { type: productSnapshotSchema, required: true },
    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "PARTIALLY_CANCELLED", "CANCELLED"],
      default: "PLACED",
    },
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },
  },
  { _id: false }
);

const vendorInvoiceSchema = new Schema<IVendorInvoiceInfo>(
  {
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, default: null },
    sellerDisplayName: { type: String, required: true },
    sellerTaxId: { type: String, default: "" },
  },
  { _id: false }
);

const vendorOrderSchema = new Schema<IVendorOrder>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shopId: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    items: { type: [orderItemSchema], default: [] },
    totalItems: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    shippingTotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "PARTIALLY_CANCELLED", "CANCELLED"],
      default: "PLACED",
    },
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },
    invoice: { type: vendorInvoiceSchema, required: true },
  },
  { _id: false }
);

const paymentAttemptSchema = new Schema<IPaymentAttempt>(
  {
    gateway: { type: String, enum: ["RAZORPAY"], default: "RAZORPAY" },
    razorpayOrderId: { type: String, default: "", trim: true },
    razorpayPaymentId: { type: String, default: "", trim: true },
    razorpaySignature: { type: String, default: "", trim: true },
    amount: { type: Number, required: true, min: 0 },
    amountSubunits: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", trim: true },
    status: {
      type: String,
      enum: ["CREATED", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "CANCELLED"],
      default: "CREATED",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    rawResponse: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const couponSnapshotSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, default: "", trim: true },
    discountType: { type: String, enum: ["PERCENTAGE", "FLAT"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoiceInfo>(
  {
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, default: null },
    companyName: { type: String, required: true },
    companyAddress: { type: String, default: "" },
    companyGst: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    addressId: { type: Schema.Types.ObjectId, ref: "Address" },
    addressSnapshot: { type: addressSnapshotSchema, required: true },
    billingAddressSnapshot: { type: addressSnapshotSchema, required: true },
    paymentMethod: { type: String, enum: ["COD", "ONLINE"], default: "COD" },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "CREATED", "AUTHORIZED", "PAID", "FAILED", "REFUNDED", "CANCELLED"],
      default: "PENDING",
    },
    paymentReference: { type: String, default: "", trim: true },
    razorpayOrderId: { type: String, default: "", trim: true, index: true },
    razorpayPaymentId: { type: String, default: "", trim: true, index: true },
    couponCode: { type: String, default: "", trim: true, uppercase: true },
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
    couponSnapshot: { type: couponSnapshotSchema, default: null },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalItems: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    shippingTotal: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "PARTIALLY_CANCELLED", "CANCELLED"],
      default: "PLACED",
      index: true,
    },
    items: { type: [orderItemSchema], default: [] },
    vendorOrders: { type: [vendorOrderSchema], default: [] },
    paymentAttempts: { type: [paymentAttemptSchema], default: [] },
    invoice: { type: invoiceSchema, required: true },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ "vendorOrders.vendorId": 1, createdAt: -1 });
orderSchema.index({ "vendorOrders.shopId": 1, createdAt: -1 });

export const OrderModel: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);
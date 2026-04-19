import { Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CartModel } from "../models/cart.model";
import { AddressModel } from "../models/address.model";
import { VendorListingModel } from "../models/vendorListing.model";
import { OrderModel } from "../models/order.model";
import { PaymentModel } from "../models/payment.model";
import { validateAndApplyCoupon } from "../utils/coupon";
import { withTransaction } from "../utils/transaction";
import { createRazorpayOrder, verifyRazorpaySignature } from "../utils/razorpay";
import { env } from "../config/env";
import { calculateItemTax } from "../utils/tax";
import { InventoryLedgerModel } from "../models/inventoryLedger.model";

function generateOrderNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${y}${m}${d}-${rand}`;
}

function canCancelOrder(status: string) {
  return ["PLACED", "CONFIRMED"].includes(status);
}

const taxableAmount = itemSubtotal;
const taxInfo = await calculateItemTax({
  taxClassId: String(listing.masterProductId.taxClassId || ""),
  taxableAmount,
  intraState: true,
});

const itemTaxAmount = taxInfo.taxAmount;
const itemGrandTotal = itemSubtotal + itemShippingTotal - itemDiscountAmount + itemTaxAmount;
const currentListing = await VendorListingModel.findById(item.vendorListingId).session(session);
if (!currentListing) {
  throw new ApiError(404, "Listing missing while writing inventory ledger");
}

const stockAfter = currentListing.stock;
const stockBefore = stockAfter + item.quantity;

await InventoryLedgerModel.create(
  [
    {
      vendorListingId: currentListing._id,
      masterProductId: currentListing.masterProductId,
      shopId: currentListing.shopId,
      vendorId: currentListing.vendorId,
      movementType: "ORDER_RESERVE",
      quantityDelta: -item.quantity,
      stockBefore,
      stockAfter,
      referenceType: "ORDER",
      referenceId: null,
      note: `Order reserve for ${orderNumber}`,
    },
  ],
  { session }
);
export const checkoutCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { addressId, paymentMethod = "COD", couponCode = "" } = req.body;

  if (!["COD", "ONLINE"].includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }

  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    throw new ApiError(400, "Invalid address id");
  }

  const result = await withTransaction(async (session) => {
    const cart = await CartModel.findOne({ userId }).session(session).lean();
    if (!cart || !cart.items.length) {
      throw new ApiError(400, "Cart is empty");
    }

    const address = await AddressModel.findOne({ _id: addressId, userId })
      .session(session)
      .lean();

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    const listingIds = cart.items.map((item) => item.vendorListingId);

    const listings = await VendorListingModel.find({
      _id: { $in: listingIds },
      isActive: true,
      isApproved: true,
    })
      .populate("masterProductId")
      .populate("shopId", "name slug logo isActive")
      .populate("vendorId", "name email role")
      .session(session)
      .lean();

    const listingMap = new Map<string, any>();
    for (const listing of listings) {
      listingMap.set(String(listing._id), listing);
    }

    const validatedItems: any[] = [];

    for (const cartItem of cart.items) {
      const listing = listingMap.get(String(cartItem.vendorListingId));

      if (!listing) {
        throw new ApiError(400, `Listing not available: ${cartItem.vendorListingId}`);
      }

      if (!(listing.shopId as any)?.isActive) {
        throw new ApiError(400, `Shop inactive for listing: ${cartItem.vendorListingId}`);
      }

      if (!listing.masterProductId) {
        throw new ApiError(400, `Product not found for listing: ${cartItem.vendorListingId}`);
      }

      if (listing.stock < cartItem.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for ${listing.masterProductId.title}`
        );
      }

      const product = listing.masterProductId;
      const shop = listing.shopId;

      const quantity = Number(cartItem.quantity);
      const price = Number(listing.sellingPrice);
      const mrp = Number(listing.mrp);
      const shippingCharge = Number(listing.shippingCharge || 0);

      const itemSubtotal = price * quantity;
      const itemShippingTotal = shippingCharge * quantity;
      const itemGrandTotal = itemSubtotal + itemShippingTotal;

      validatedItems.push({
        vendorId: listing.vendorId._id,
        shopId: shop._id,
        masterProductId: product._id,
        vendorListingId: listing._id,
        quantity,
        price,
        mrp,
        shippingCharge,
        itemSubtotal,
        itemShippingTotal,
        itemGrandTotal,
        productSnapshot: {
          masterProductId: product._id,
          vendorListingId: listing._id,
          productTitle: product.title,
          productSlug: product.slug,
          skuCode: product.skuCode,
          modelName: product.modelName || "",
          productImage: listing.images?.[0]?.url || product.images?.[0]?.url || "",
          brandName: (product.brandId as any)?.name || "",
          categoryName: (product.categoryId as any)?.name || "",
          shopName: shop.name || "",
        },
        status: "PLACED",
        isCancelled: false,
        cancelledAt: null,
      });
    }

    if (!validatedItems.length) {
      throw new ApiError(400, "No valid items found for checkout");
    }

    const vendorOrderMap = new Map<string, any>();

    for (const item of validatedItems) {
      const key = `${String(item.vendorId)}__${String(item.shopId)}`;

      if (!vendorOrderMap.has(key)) {
        vendorOrderMap.set(key, {
          vendorId: item.vendorId,
          shopId: item.shopId,
          items: [],
          totalItems: 0,
          subtotal: 0,
          shippingTotal: 0,
          grandTotal: 0,
          status: "PLACED",
          isCancelled: false,
          cancelledAt: null,
        });
      }

      const vendorBucket = vendorOrderMap.get(key);
      vendorBucket.items.push(item);
      vendorBucket.totalItems += item.quantity;
      vendorBucket.subtotal += item.itemSubtotal;
      vendorBucket.shippingTotal += item.itemShippingTotal;
      vendorBucket.grandTotal += item.itemGrandTotal;
    }

    const vendorOrders = Array.from(vendorOrderMap.values());

    const totalItems = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = validatedItems.reduce((sum, item) => sum + item.itemSubtotal, 0);
    const shippingTotal = validatedItems.reduce(
      (sum, item) => sum + item.itemShippingTotal,
      0
    );

    const couponResult = await validateAndApplyCoupon({
      userId,
      couponCode,
      subtotal,
    });

    const discountAmount = couponResult.discountAmount || 0;
    const grandTotal = Math.max(0, subtotal + shippingTotal - discountAmount);

    const orderNumber = generateOrderNumber();

    for (const item of validatedItems) {
      const updateResult = await VendorListingModel.updateOne(
        {
          _id: item.vendorListingId,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
        { session }
      );

      if (!updateResult.modifiedCount) {
        throw new ApiError(
          400,
          `Stock changed during checkout for ${item.productSnapshot.productTitle}`
        );
      }
    }

    let paymentAttempts: any[] = [];
    let paymentStatus: "PENDING" | "CREATED" | "PAID" = paymentMethod === "COD" ? "PENDING" : "CREATED";

    if (paymentMethod === "ONLINE") {
      const razorpayOrder = await createRazorpayOrder({
        amount: Math.round(grandTotal * 100),
        currency: "INR",
        receipt: orderNumber,
        notes: {
          orderNumber,
          userId,
        },
      });

      paymentAttempts.push({
        gateway: "RAZORPAY",
        razorpayOrderId: razorpayOrder.id,
        amount: grandTotal,
        currency: "INR",
        status: "CREATED",
        createdAt: new Date(),
        updatedAt: new Date(),
        rawResponse: razorpayOrder,
      });
    }

    const order = await OrderModel.create(
      [
        {
          orderNumber,
          userId,
          addressId: address._id,
          addressSnapshot: {
            fullName: address.fullName,
            mobile: address.mobile,
            alternateMobile: address.alternateMobile || "",
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || "",
            landmark: address.landmark || "",
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
            addressType: address.addressType,
          },
          paymentMethod,
          paymentStatus,
          paymentReference: "",
          couponCode: couponResult.coupon?.code || "",
          couponId: couponResult.coupon?._id || null,
          couponSnapshot: couponResult.couponSnapshot || null,
          discountAmount,
          totalItems,
          subtotal,
          shippingTotal,
          grandTotal,
          status: "PLACED",
          items: validatedItems,
          vendorOrders,
          paymentAttempts,
          cancelledAt: null,
          cancellationReason: "",
        },
      ],
      { session }
    );

    const savedOrder = order[0];

    if (couponResult.coupon) {
      await (couponResult.coupon as any).updateOne(
        { $inc: { usedCount: 1 } },
        { session }
      );
    }

    if (paymentMethod === "ONLINE" && savedOrder.paymentAttempts.length > 0) {
      const attempt = savedOrder.paymentAttempts[0];

      await PaymentModel.create(
        [
          {
            orderId: savedOrder._id,
            userId,
            gateway: "RAZORPAY",
            currency: attempt.currency,
            amount: attempt.amount,
            razorpayOrderId: attempt.razorpayOrderId,
            status: "CREATED",
            rawResponse: attempt.rawResponse || {},
          },
        ],
        { session }
      );
    }

    await CartModel.updateOne({ userId }, { $set: { items: [] } }, { session });

    return savedOrder;
  });

  res.status(201).json(
    new ApiResponse("Checkout completed successfully", {
      order: result,
    })
  );
});

export const verifyOnlinePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const {
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    rawResponse = {},
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order id");
  }

  const order = await OrderModel.findOne({ _id: orderId, userId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentMethod !== "ONLINE") {
    throw new ApiError(400, "This is not an online payment order");
  }

  const isValid = verifyRazorpaySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
    secret: env.RAZORPAY_KEY_SECRET,
  });

  if (!isValid) {
    order.paymentStatus = "FAILED";
    order.paymentAttempts = order.paymentAttempts.map((attempt: any) => {
      if (attempt.razorpayOrderId === razorpayOrderId) {
        return {
          ...attempt,
          razorpayPaymentId,
          razorpaySignature,
          status: "FAILED",
          updatedAt: new Date(),
          rawResponse,
        };
      }
      return attempt;
    });

    await order.save();

    await PaymentModel.updateOne(
      { orderId: order._id, razorpayOrderId },
      {
        $set: {
          razorpayPaymentId,
          razorpaySignature,
          status: "FAILED",
          rawResponse,
        },
      }
    );

    throw new ApiError(400, "Payment signature verification failed");
  }

  order.paymentStatus = "PAID";
  order.paymentReference = razorpayPaymentId;
  order.paymentAttempts = order.paymentAttempts.map((attempt: any) => {
    if (attempt.razorpayOrderId === razorpayOrderId) {
      return {
        ...attempt,
        razorpayPaymentId,
        razorpaySignature,
        status: "PAID",
        updatedAt: new Date(),
        rawResponse,
      };
    }
    return attempt;
  });

  await order.save();

  await PaymentModel.updateOne(
    { orderId: order._id, razorpayOrderId },
    {
      $set: {
        razorpayPaymentId,
        razorpaySignature,
        status: "PAID",
        rawResponse,
      },
    }
  );

  res.status(200).json(
    new ApiResponse("Payment verified successfully", {
      order,
    })
  );
});

export const cancelMyOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  const { reason = "Cancelled by customer" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid order id");
  }

  const result = await withTransaction(async (session) => {
    const order = await OrderModel.findOne({ _id: id, userId }).session(session);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (!canCancelOrder(order.status)) {
      throw new ApiError(400, "This order cannot be cancelled now");
    }

    if (order.status === "CANCELLED") {
      throw new ApiError(400, "Order is already cancelled");
    }

    for (const item of order.items) {
      await VendorListingModel.updateOne(
        { _id: item.vendorListingId },
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    order.status = "CANCELLED";
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    order.paymentStatus =
      order.paymentMethod === "COD" ? "CANCELLED" : order.paymentStatus;

    order.items = order.items.map((item: any) => ({
      ...item,
      status: "CANCELLED",
      isCancelled: true,
      cancelledAt: new Date(),
    }));

    order.vendorOrders = order.vendorOrders.map((vo: any) => ({
      ...vo,
      status: "CANCELLED",
      isCancelled: true,
      cancelledAt: new Date(),
      items: vo.items.map((item: any) => ({
        ...item,
        status: "CANCELLED",
        isCancelled: true,
        cancelledAt: new Date(),
      })),
    }));

    if (order.paymentMethod === "ONLINE") {
      order.paymentAttempts = order.paymentAttempts.map((attempt: any) => ({
        ...attempt,
        status:
          attempt.status === "PAID" ? attempt.status : "CANCELLED",
        updatedAt: new Date(),
      }));

      await PaymentModel.updateMany(
        { orderId: order._id, status: { $in: ["CREATED"] } },
        { $set: { status: "CANCELLED" } },
        { session }
      );
    }

    if (order.couponId) {
      await mongoose.model("Coupon").updateOne(
        { _id: order.couponId, usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } },
        { session }
      );
    }

    await order.save({ session });

    return order;
  });

  res.status(200).json(new ApiResponse("Order cancelled successfully", result));
});
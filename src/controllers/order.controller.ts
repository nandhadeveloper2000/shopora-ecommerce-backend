import mongoose from "mongoose";
import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middlewares/auth.middleware";
import { OrderModel } from "../models/order.model";
import { VendorListingModel } from "../models/vendorListing.model";
import { PaymentModel } from "../models/payment.model";
import { withTransaction } from "../utils/transaction";
import { ROLES } from "../constants/roles";

function recalculateParentOrder(order: any) {
  const activeVendorOrders = order.vendorOrders.filter((vo: any) => !vo.isCancelled);

  order.totalItems = activeVendorOrders.reduce((sum: number, vo: any) => sum + vo.totalItems, 0);
  order.subtotal = activeVendorOrders.reduce((sum: number, vo: any) => sum + vo.subtotal, 0);
  order.shippingTotal = activeVendorOrders.reduce((sum: number, vo: any) => sum + vo.shippingTotal, 0);
  order.taxAmount = activeVendorOrders.reduce((sum: number, vo: any) => sum + (vo.taxAmount || 0), 0);

  const cancelledVendorCount = order.vendorOrders.filter((vo: any) => vo.isCancelled).length;

  if (cancelledVendorCount === order.vendorOrders.length) {
    order.status = "CANCELLED";
    order.cancelledAt = new Date();
  } else if (cancelledVendorCount > 0) {
    order.status = "PARTIALLY_CANCELLED";
  }

  order.grandTotal = Math.max(
    0,
    order.subtotal + order.shippingTotal + order.taxAmount - order.discountAmount
  );
}

function canCustomerCancelBucket(status: string) {
  return ["PLACED", "CONFIRMED"].includes(status);
}

export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse("Orders fetched successfully", orders));
});

export const getMySingleOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order id");

  const order = await OrderModel.findOne({ _id: id, userId });
  if (!order) throw new ApiError(404, "Order not found");

  res.status(200).json(new ApiResponse("Order fetched successfully", order));
});

export const cancelMyVendorBucket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  const { shopId, reason = "Cancelled by customer" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order id");
  if (!mongoose.Types.ObjectId.isValid(shopId)) throw new ApiError(400, "Invalid shop id");

  const result = await withTransaction(async (session) => {
    const order = await OrderModel.findOne({ _id: id, userId }).session(session);
    if (!order) throw new ApiError(404, "Order not found");

    const bucket = order.vendorOrders.find((vo: any) => String(vo.shopId) === String(shopId));
    if (!bucket) throw new ApiError(404, "Vendor order bucket not found");
    if (bucket.isCancelled) throw new ApiError(400, "Vendor bucket already cancelled");
    if (!canCustomerCancelBucket(bucket.status)) {
      throw new ApiError(400, "This vendor bucket cannot be cancelled now");
    }

    for (const item of bucket.items) {
      await VendorListingModel.updateOne(
        { _id: item.vendorListingId },
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    bucket.isCancelled = true;
    bucket.cancelledAt = new Date();
    bucket.status = "CANCELLED";
    bucket.items = bucket.items.map((item: any) => ({
      ...item,
      isCancelled: true,
      cancelledAt: new Date(),
      status: "CANCELLED",
    }));

    order.items = order.items.map((item: any) =>
      String(item.shopId) === String(shopId)
        ? {
            ...item,
            isCancelled: true,
            cancelledAt: new Date(),
            status: "CANCELLED",
          }
        : item
    );

    recalculateParentOrder(order);

    if (order.paymentMethod === "ONLINE" && order.paymentStatus === "CREATED") {
      await PaymentModel.updateMany(
        { orderId: order._id, status: "CREATED" },
        { $set: { status: "CANCELLED" } },
        { session }
      );

      order.paymentAttempts = order.paymentAttempts.map((attempt: any) => ({
        ...attempt,
        status: attempt.status === "CREATED" ? "CANCELLED" : attempt.status,
        updatedAt: new Date(),
      }));

      if (order.status === "CANCELLED") {
        order.paymentStatus = "CANCELLED";
      }
    }

    if (order.status === "CANCELLED") {
      order.cancellationReason = reason;
    }

    await order.save({ session });
    return order;
  });

  res.status(200).json(new ApiResponse("Vendor bucket cancelled successfully", result));
});

export const getVendorOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  if (!userId) throw new ApiError(401, "Unauthorized");
  if (role !== ROLES.VENDOR && role !== ROLES.ADMIN && role !== ROLES.MASTER_ADMIN) {
    throw new ApiError(403, "Forbidden");
  }

  let orders;

  if (role === ROLES.ADMIN || role === ROLES.MASTER_ADMIN) {
    orders = await OrderModel.find().sort({ createdAt: -1 });
  } else {
    orders = await OrderModel.find({
      "vendorOrders.vendorId": new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });
  }

  const mapped = orders.map((order: any) => {
    if (role === ROLES.ADMIN || role === ROLES.MASTER_ADMIN) return order;

    const vendorOrders = order.vendorOrders.filter(
      (vo: any) => String(vo.vendorId) === String(userId)
    );

    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      addressSnapshot: order.addressSnapshot,
      billingAddressSnapshot: order.billingAddressSnapshot,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalItems: order.totalItems,
      subtotal: order.subtotal,
      shippingTotal: order.shippingTotal,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      grandTotal: order.grandTotal,
      status: order.status,
      invoice: order.invoice,
      vendorOrders,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  });

  res.status(200).json(new ApiResponse("Vendor orders fetched successfully", mapped));
});

export const getVendorSingleOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order id");

  const order = await OrderModel.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  if (role === ROLES.ADMIN || role === ROLES.MASTER_ADMIN) {
    return res.status(200).json(new ApiResponse("Order fetched successfully", order));
  }

  if (role !== ROLES.VENDOR) throw new ApiError(403, "Forbidden");

  const vendorOrders = order.vendorOrders.filter(
    (vo: any) => String(vo.vendorId) === String(userId)
  );

  if (!vendorOrders.length) throw new ApiError(403, "You do not have access to this order");

  res.status(200).json(
    new ApiResponse("Vendor order fetched successfully", {
      _id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      addressSnapshot: order.addressSnapshot,
      billingAddressSnapshot: order.billingAddressSnapshot,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalItems: order.totalItems,
      subtotal: order.subtotal,
      shippingTotal: order.shippingTotal,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      grandTotal: order.grandTotal,
      status: order.status,
      invoice: order.invoice,
      vendorOrders,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    })
  );
});

export const updateVendorOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  const { status, shopId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid order id");

  const allowedStatuses = [
    "PLACED",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "PARTIALLY_CANCELLED",
    "CANCELLED",
  ];

  if (!allowedStatuses.includes(status)) throw new ApiError(400, "Invalid order status");

  const order = await OrderModel.findById(id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status === "CANCELLED") throw new ApiError(400, "Cancelled order cannot be updated");

  if (role === ROLES.ADMIN || role === ROLES.MASTER_ADMIN) {
    if (shopId) {
      let found = false;

      order.vendorOrders = order.vendorOrders.map((vo: any) => {
        if (String(vo.shopId) === String(shopId)) {
          found = true;
          vo.status = status;
          vo.items = vo.items.map((item: any) => ({ ...item, status }));
        }
        return vo;
      });

      if (!found) throw new ApiError(404, "Vendor order bucket not found");
    } else {
      order.status = status as any;
      order.items = order.items.map((item: any) => ({ ...item, status }));
      order.vendorOrders = order.vendorOrders.map((vo: any) => ({
        ...vo,
        status,
        items: vo.items.map((item: any) => ({ ...item, status })),
      }));
    }

    await order.save();
    return res.status(200).json(new ApiResponse("Order status updated successfully", order));
  }

  if (role !== ROLES.VENDOR) throw new ApiError(403, "Forbidden");

  let found = false;

  order.vendorOrders = order.vendorOrders.map((vo: any) => {
    if (String(vo.vendorId) === String(userId)) {
      found = true;
      vo.status = status;
      vo.items = vo.items.map((item: any) => ({ ...item, status }));
    }
    return vo;
  });

  if (!found) throw new ApiError(403, "You do not have access to update this order");

  const activeVendorOrders = order.vendorOrders.filter((vo: any) => !vo.isCancelled);

  if (activeVendorOrders.length && activeVendorOrders.every((vo: any) => vo.status === "DELIVERED")) {
    order.status = "DELIVERED";
  } else if (activeVendorOrders.some((vo: any) => vo.status === "SHIPPED")) {
    order.status = "SHIPPED";
  } else if (activeVendorOrders.some((vo: any) => vo.status === "PROCESSING")) {
    order.status = "PROCESSING";
  } else if (activeVendorOrders.some((vo: any) => vo.status === "CONFIRMED")) {
    order.status = "CONFIRMED";
  }

  await order.save();
  res.status(200).json(new ApiResponse("Vendor order status updated successfully", order));
});
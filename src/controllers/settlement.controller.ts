import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { SettlementLedgerModel } from "../models/settlementLedger.model";
import { OrderModel } from "../models/order.model";

export const generateSettlementEntriesForOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order id");
  }

  const order = await OrderModel.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  const existing = await SettlementLedgerModel.find({ orderId });
  if (existing.length) {
    return res.status(200).json(new ApiResponse("Settlement entries already exist", existing));
  }

  const entries = [];

  for (const bucket of order.vendorOrders as any[]) {
    if (bucket.isCancelled) continue;

    const grossAmount = bucket.subtotal;
    const shippingAmount = bucket.shippingTotal || 0;
    const taxAmount = bucket.taxAmount || 0;
    const discountShare = bucket.discountAmount || 0;

    const platformFee = Number((grossAmount * 0.05).toFixed(2));
    const gatewayFee = order.paymentMethod === "ONLINE"
      ? Number((order.grandTotal * 0.02 * (bucket.grandTotal / Math.max(order.grandTotal, 1))).toFixed(2))
      : 0;

    const netPayable = Math.max(
      0,
      grossAmount + shippingAmount + taxAmount - discountShare - platformFee - gatewayFee
    );

    entries.push({
      orderId: order._id,
      shopId: bucket.shopId,
      vendorId: bucket.vendorId,
      grossAmount,
      shippingAmount,
      taxAmount,
      discountShare,
      platformFee,
      gatewayFee,
      netPayable,
      settlementStatus: order.paymentStatus === "PAID" || order.paymentMethod === "COD" ? "READY" : "PENDING",
      payoutReference: "",
      payoutDate: null,
    });
  }

  const created = await SettlementLedgerModel.insertMany(entries);
  res.status(201).json(new ApiResponse("Settlement entries created successfully", created));
});

export const getAdminSettlementLedger = asyncHandler(async (_req: Request, res: Response) => {
  const entries = await SettlementLedgerModel.find()
    .populate("vendorId", "name email")
    .populate("shopId", "name slug")
    .populate("orderId", "orderNumber paymentMethod paymentStatus status")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("Settlement ledger fetched successfully", entries));
});

export const markSettlementPaid = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { payoutReference = "" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid settlement id");

  const entry = await SettlementLedgerModel.findById(id);
  if (!entry) throw new ApiError(404, "Settlement entry not found");

  entry.settlementStatus = "PAID";
  entry.payoutReference = payoutReference;
  entry.payoutDate = new Date();
  await entry.save();

  res.status(200).json(new ApiResponse("Settlement marked as paid", entry));
});

export const getVendorPayoutReport = asyncHandler(async (req: Request, res: Response) => {
  const { vendorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vendorId)) throw new ApiError(400, "Invalid vendor id");

  const report = await SettlementLedgerModel.aggregate([
    {
      $match: {
        vendorId: new mongoose.Types.ObjectId(vendorId),
      },
    },
    {
      $group: {
        _id: "$settlementStatus",
        totalGrossAmount: { $sum: "$grossAmount" },
        totalShippingAmount: { $sum: "$shippingAmount" },
        totalTaxAmount: { $sum: "$taxAmount" },
        totalDiscountShare: { $sum: "$discountShare" },
        totalPlatformFee: { $sum: "$platformFee" },
        totalGatewayFee: { $sum: "$gatewayFee" },
        totalNetPayable: { $sum: "$netPayable" },
        count: { $sum: 1 },
      },
    },
  ]);

  const lines = await SettlementLedgerModel.find({ vendorId })
    .populate("orderId", "orderNumber")
    .populate("shopId", "name slug")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse("Vendor payout report fetched successfully", {
      summary: report,
      lines,
    })
  );
});
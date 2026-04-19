import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { OrderModel } from "../models/order.model";
import { SettlementLedgerModel } from "../models/settlementLedger.model";
import { InventoryLedgerModel } from "../models/inventoryLedger.model";
import { RefundRequestModel } from "../models/refundRequest.model";
import { ReturnRequestModel } from "../models/returnRequest.model";
import { WebhookEventModel } from "../models/webhookEvent.model";

export const getAdminDashboardAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalOrders,
    paidOrders,
    totalRevenueAgg,
    settlementAgg,
    refundAgg,
    returnAgg,
    inventoryAgg,
    webhookAgg,
  ] = await Promise.all([
    OrderModel.countDocuments(),
    OrderModel.countDocuments({ paymentStatus: "PAID" }),
    OrderModel.aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$grandTotal" } } }]),
    SettlementLedgerModel.aggregate([
      {
        $group: {
          _id: "$settlementStatus",
          totalNetPayable: { $sum: "$netPayable" },
          count: { $sum: 1 },
        },
      },
    ]),
    RefundRequestModel.aggregate([
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    ReturnRequestModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    InventoryLedgerModel.aggregate([
      {
        $group: {
          _id: "$movementType",
          quantityDelta: { $sum: "$quantityDelta" },
          count: { $sum: 1 },
        },
      },
    ]),
    WebhookEventModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.status(200).json(
    new ApiResponse("Dashboard analytics fetched successfully", {
      orders: {
        totalOrders,
        paidOrders,
        totalRevenue: totalRevenueAgg[0]?.totalRevenue || 0,
      },
      settlements: settlementAgg,
      refunds: refundAgg,
      returns: returnAgg,
      inventory: inventoryAgg,
      webhooks: webhookAgg,
    })
  );
});

export const getVendorDashboardAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const vendorId = req.params.vendorId;

  const [orderAgg, settlementAgg, inventoryAgg, returnAgg] = await Promise.all([
    OrderModel.aggregate([
      { $unwind: "$vendorOrders" },
      { $match: { "vendorOrders.vendorId": req.params.vendorId } },
      {
        $group: {
          _id: null,
          totalVendorSales: { $sum: "$vendorOrders.grandTotal" },
          totalVendorOrders: { $sum: 1 },
        },
      },
    ]),
    SettlementLedgerModel.aggregate([
      { $match: { vendorId: req.params.vendorId } },
      {
        $group: {
          _id: "$settlementStatus",
          totalNetPayable: { $sum: "$netPayable" },
          count: { $sum: 1 },
        },
      },
    ]),
    InventoryLedgerModel.aggregate([
      { $match: { vendorId } },
      {
        $group: {
          _id: "$movementType",
          quantityDelta: { $sum: "$quantityDelta" },
          count: { $sum: 1 },
        },
      },
    ]),
    ReturnRequestModel.aggregate([
      { $match: { vendorId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.status(200).json(
    new ApiResponse("Vendor dashboard analytics fetched successfully", {
      orders: orderAgg[0] || { totalVendorSales: 0, totalVendorOrders: 0 },
      settlements: settlementAgg,
      inventory: inventoryAgg,
      returns: returnAgg,
    })
  );
});
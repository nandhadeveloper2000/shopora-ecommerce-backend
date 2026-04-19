import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { OrderModel } from "../models/order.model";

export const getGstSummaryReport = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query;

  const query: Record<string, unknown> = {};
  if (from || to) {
    query.createdAt = {};
    if (from) (query.createdAt as Record<string, unknown>).$gte = new Date(String(from));
    if (to) (query.createdAt as Record<string, unknown>).$lte = new Date(String(to));
  }

  const orders = await OrderModel.find(query).sort({ createdAt: -1 });

  const summary = orders.reduce(
    (acc, order: any) => {
      acc.subtotal += order.subtotal || 0;
      acc.shippingTotal += order.shippingTotal || 0;
      acc.discountAmount += order.discountAmount || 0;
      acc.taxAmount += order.taxAmount || 0;
      acc.grandTotal += order.grandTotal || 0;
      acc.count += 1;
      return acc;
    },
    {
      subtotal: 0,
      shippingTotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      grandTotal: 0,
      count: 0,
    }
  );

  res.status(200).json(new ApiResponse("GST summary report fetched successfully", summary));
});
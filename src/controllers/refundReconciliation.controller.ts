import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { RefundRequestModel } from "../models/refundRequest.model";
import { PaymentModel } from "../models/payment.model";

export const getRefundReconciliation = asyncHandler(async (_req: Request, res: Response) => {
  const refunds = await RefundRequestModel.find().sort({ createdAt: -1 });
  const payments = await PaymentModel.find().sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse("Refund reconciliation fetched successfully", {
      refunds,
      payments,
    })
  );
});
import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { CreditNoteModel } from "../models/creditNote.model";
import { RefundRequestModel } from "../models/refundRequest.model";
import { getNextSequenceNumber, formatSequence } from "../utils/sequence";

export const issueCreditNote = asyncHandler(async (req: Request, res: Response) => {
  const { refundRequestId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(refundRequestId)) {
    throw new ApiError(400, "Invalid refundRequestId");
  }

  const refund = await RefundRequestModel.findById(refundRequestId);
  if (!refund) {
    throw new ApiError(404, "Refund request not found");
  }

  const existing = await CreditNoteModel.findOne({ refundRequestId });
  if (existing) {
    return res.status(200).json(new ApiResponse("Credit note already exists", existing));
  }

  const seq = await getNextSequenceNumber("VENDOR_INVOICE");
  const creditNoteNumber = formatSequence("CN", seq.financialYear, seq.number);

  const doc = await CreditNoteModel.create({
    creditNoteNumber,
    orderId: refund.orderId,
    refundRequestId: refund._id,
    userId: refund.userId,
    amount: refund.amount,
    reason: refund.reason,
    status: "ISSUED",
  });

  res.status(201).json(new ApiResponse("Credit note issued successfully", doc));
});
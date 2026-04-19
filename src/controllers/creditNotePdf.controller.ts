import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { CreditNoteModel } from "../models/creditNote.model";
import { RefundRequestModel } from "../models/refundRequest.model";
import { UserModel } from "../models/user.model";
import { buildCreditNotePdf } from "../utils/creditNotePdf";

export const downloadCreditNotePdf = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid credit note id");
  }

  const creditNote = await CreditNoteModel.findById(id);
  if (!creditNote) {
    throw new ApiError(404, "Credit note not found");
  }

  const refund = creditNote.refundRequestId
    ? await RefundRequestModel.findById(creditNote.refundRequestId)
    : null;

  const user = await UserModel.findById(creditNote.userId);

  const payload = {
    creditNoteNumber: creditNote.creditNoteNumber,
    orderNumber: String(creditNote.orderId),
    reason: creditNote.reason,
    amount: creditNote.amount,
    createdAt: creditNote.createdAt,
    status: creditNote.status,
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    refundId: refund?._id || "",
  };

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${creditNote.creditNoteNumber}.pdf"`);

  const doc = buildCreditNotePdf(payload);
  doc.pipe(res);
});
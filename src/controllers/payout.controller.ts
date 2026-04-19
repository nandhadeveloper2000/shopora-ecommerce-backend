import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { VendorFundAccountModel } from "../models/vendorFundAccount.model";
import { SettlementLedgerModel } from "../models/settlementLedger.model";
import {
  createRazorpayXContact,
  createRazorpayXFundAccount,
  createRazorpayXPayout,
} from "../utils/razorpayx";

export const upsertVendorFundAccount = asyncHandler(async (req: Request, res: Response) => {
  const { vendorId, shopId, contactName, contactEmail, contactPhone, accountHolderName, ifsc, accountNumber } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(shopId)) {
    throw new ApiError(400, "Invalid vendorId or shopId");
  }

  let item = await VendorFundAccountModel.findOne({ vendorId, shopId });

  if (!item) {
    item = await VendorFundAccountModel.create({
      vendorId,
      shopId,
      contactName,
      contactEmail,
      contactPhone,
      accountHolderName,
      ifsc,
      accountNumber,
      accountType: "bank_account",
      isActive: true,
    });
  } else {
    item.contactName = contactName;
    item.contactEmail = contactEmail || "";
    item.contactPhone = contactPhone || "";
    item.accountHolderName = accountHolderName;
    item.ifsc = String(ifsc).toUpperCase();
    item.accountNumber = accountNumber;
    item.isActive = true;
    await item.save();
  }

  if (!item.razorpayxContactId) {
    const contact = await createRazorpayXContact({
      name: item.contactName,
      email: item.contactEmail,
      contact: item.contactPhone,
      reference_id: `${item.vendorId}_${item.shopId}`,
      type: "vendor",
    });
    item.razorpayxContactId = contact.id;
  }

  if (!item.razorpayxFundAccountId) {
    const fund = await createRazorpayXFundAccount({
      contact_id: item.razorpayxContactId!,
      name: item.accountHolderName,
      ifsc: item.ifsc,
      account_number: item.accountNumber,
    });
    item.razorpayxFundAccountId = fund.id;
  }

  await item.save();

  res.status(200).json(new ApiResponse("Vendor fund account saved successfully", item));
});

export const executeSettlementPayout = asyncHandler(async (req: Request, res: Response) => {
  const { settlementId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(settlementId)) {
    throw new ApiError(400, "Invalid settlement id");
  }

  const settlement = await SettlementLedgerModel.findById(settlementId);
  if (!settlement) throw new ApiError(404, "Settlement entry not found");
  if (settlement.settlementStatus !== "READY") {
    throw new ApiError(400, "Settlement is not ready for payout");
  }

  const fund = await VendorFundAccountModel.findOne({
    vendorId: settlement.vendorId,
    shopId: settlement.shopId,
    isActive: true,
  });

  if (!fund?.razorpayxFundAccountId) {
    throw new ApiError(400, "Vendor fund account is not configured");
  }

  const payout = await createRazorpayXPayout({
    fund_account_id: fund.razorpayxFundAccountId,
    amountSubunits: Math.round(settlement.netPayable * 100),
    reference_id: String(settlement._id),
    narration: `Settlement ${settlement._id}`,
  });

  settlement.settlementStatus = "PAID";
  settlement.payoutReference = payout.data.id || payout.idempotencyKey;
  settlement.payoutDate = new Date();
  await settlement.save();

  res.status(200).json(
    new ApiResponse("Settlement payout executed successfully", {
      settlement,
      payout,
    })
  );
});
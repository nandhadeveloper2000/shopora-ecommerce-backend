import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { VendorFundAccountModel } from "../models/vendorFundAccount.model";
import { createRazorpayXContact, createRazorpayXFundAccount } from "../utils/razorpayx";
import { createNotification } from "../utils/notification";

export const submitMyFundAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vendorId = req.user?.id;
  if (!vendorId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { shopId, contactName, contactEmail, contactPhone, accountHolderName, ifsc, accountNumber } =
    req.body;

  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    throw new ApiError(400, "Invalid shopId");
  }

  const item = await VendorFundAccountModel.findOneAndUpdate(
    { vendorId, shopId },
    {
      $set: {
        contactName,
        contactEmail: contactEmail || "",
        contactPhone: contactPhone || "",
        accountHolderName,
        ifsc: String(ifsc).toUpperCase(),
        accountNumber,
        submissionStatus: "SUBMITTED",
        verificationNote: "",
        submittedByVendor: true,
        isActive: false,
      },
    },
    { new: true, upsert: true }
  );

  await createNotification({
    vendorId,
    shopId,
    audienceType: "ADMIN",
    title: "Vendor payout account submitted",
    message: `Vendor submitted payout account for shop ${shopId}`,
    eventType: "PAYOUT",
    meta: { fundAccountId: item._id },
  });

  res.status(200).json(new ApiResponse("Fund account submitted successfully", item));
});

export const getMyFundAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vendorId = req.user?.id;
  if (!vendorId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { shopId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    throw new ApiError(400, "Invalid shopId");
  }

  const item = await VendorFundAccountModel.findOne({ vendorId, shopId });
  if (!item) {
    throw new ApiError(404, "Fund account not found");
  }

  res.status(200).json(new ApiResponse("Fund account fetched successfully", item));
});

export const getAllFundAccountsForAdmin = asyncHandler(async (_req, res: Response) => {
  const items = await VendorFundAccountModel.find()
    .populate("vendorId", "name email")
    .populate("shopId", "name slug")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("Fund accounts fetched successfully", items));
});

export const approveFundAccount = asyncHandler(async (req, res: Response) => {
  const { id } = req.params;
  const { verificationNote = "" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid fund account id");
  }

  const item = await VendorFundAccountModel.findById(id);
  if (!item) {
    throw new ApiError(404, "Fund account not found");
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

  item.submissionStatus = "APPROVED";
  item.verificationNote = verificationNote;
  item.isActive = true;
  await item.save();

  await createNotification({
    vendorId: String(item.vendorId),
    shopId: String(item.shopId),
    audienceType: "VENDOR",
    title: "Payout account approved",
    message: "Your payout bank account has been approved",
    eventType: "PAYOUT",
    meta: { fundAccountId: item._id },
  });

  res.status(200).json(new ApiResponse("Fund account approved successfully", item));
});

export const rejectFundAccount = asyncHandler(async (req, res: Response) => {
  const { id } = req.params;
  const { verificationNote = "Rejected by admin" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid fund account id");
  }

  const item = await VendorFundAccountModel.findById(id);
  if (!item) {
    throw new ApiError(404, "Fund account not found");
  }

  item.submissionStatus = "REJECTED";
  item.verificationNote = verificationNote;
  item.isActive = false;
  await item.save();

  await createNotification({
    vendorId: String(item.vendorId),
    shopId: String(item.shopId),
    audienceType: "VENDOR",
    title: "Payout account rejected",
    message: verificationNote,
    eventType: "PAYOUT",
    meta: { fundAccountId: item._id },
  });

  res.status(200).json(new ApiResponse("Fund account rejected successfully", item));
});
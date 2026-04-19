import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { CouponModel } from "../models/coupon.model";

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const {
    code,
    title,
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    totalUsageLimit,
    perUserUsageLimit,
    validFrom,
    validUntil,
    isActive,
    applicableUserIds,
    applicableCategoryIds,
    applicableBrandIds,
  } = req.body;

  if (!code || !title || !discountType || discountValue === undefined || !validFrom || !validUntil) {
    throw new ApiError(400, "Required coupon fields are missing");
  }

  const normalizedCode = String(code).trim().toUpperCase();

  const exists = await CouponModel.findOne({ code: normalizedCode });
  if (exists) {
    throw new ApiError(400, "Coupon code already exists");
  }

  const coupon = await CouponModel.create({
    code: normalizedCode,
    title,
    description: description || "",
    discountType,
    discountValue,
    maxDiscountAmount: maxDiscountAmount || 0,
    minOrderAmount: minOrderAmount || 0,
    totalUsageLimit: totalUsageLimit || 0,
    perUserUsageLimit: perUserUsageLimit || 0,
    validFrom,
    validUntil,
    isActive: typeof isActive === "boolean" ? isActive : true,
    applicableUserIds: applicableUserIds || [],
    applicableCategoryIds: applicableCategoryIds || [],
    applicableBrandIds: applicableBrandIds || [],
  });

  res.status(201).json(new ApiResponse("Coupon created successfully", coupon));
});

export const getCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await CouponModel.find().sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("Coupons fetched successfully", coupons));
});

export const getSingleCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid coupon id");
  }

  const coupon = await CouponModel.findById(id);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  res.status(200).json(new ApiResponse("Coupon fetched successfully", coupon));
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid coupon id");
  }

  const coupon = await CouponModel.findById(id);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  const updates = { ...req.body };

  if (updates.code !== undefined) {
    updates.code = String(updates.code).trim().toUpperCase();

    const exists = await CouponModel.findOne({
      code: updates.code,
      _id: { $ne: coupon._id },
    });

    if (exists) {
      throw new ApiError(400, "Coupon code already exists");
    }
  }

  Object.assign(coupon, updates);
  await coupon.save();

  res.status(200).json(new ApiResponse("Coupon updated successfully", coupon));
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid coupon id");
  }

  const coupon = await CouponModel.findById(id);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }

  await coupon.deleteOne();

  res.status(200).json(new ApiResponse("Coupon deleted successfully"));
});
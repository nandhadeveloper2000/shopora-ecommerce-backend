import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { TaxClassModel } from "../models/taxClass.model";

export const createTaxClass = asyncHandler(async (req: Request, res: Response) => {
  const taxClass = await TaxClassModel.create(req.body);
  res.status(201).json(new ApiResponse("Tax class created successfully", taxClass));
});

export const getTaxClasses = asyncHandler(async (_req: Request, res: Response) => {
  const list = await TaxClassModel.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse("Tax classes fetched successfully", list));
});

export const updateTaxClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid tax class id");

  const item = await TaxClassModel.findByIdAndUpdate(id, req.body, { new: true });
  if (!item) throw new ApiError(404, "Tax class not found");

  res.status(200).json(new ApiResponse("Tax class updated successfully", item));
});

export const deleteTaxClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid tax class id");

  const item = await TaxClassModel.findById(id);
  if (!item) throw new ApiError(404, "Tax class not found");

  await item.deleteOne();
  res.status(200).json(new ApiResponse("Tax class deleted successfully"));
});
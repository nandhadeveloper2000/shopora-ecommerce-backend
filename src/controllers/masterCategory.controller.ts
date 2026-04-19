import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { MasterCategoryModel } from "../models/masterCategory.model";
import { slugify } from "../utils/slugify";

export const createMasterCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, isActive } = req.body;

  if (!name) {
    throw new ApiError(400, "Name is required");
  }

  const finalSlug = slugify(slug || name);

  const existing = await MasterCategoryModel.findOne({ slug: finalSlug });
  if (existing) {
    throw new ApiError(400, "Master category already exists");
  }

  const masterCategory = await MasterCategoryModel.create({
    name,
    slug: finalSlug,
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  res
    .status(201)
    .json(new ApiResponse("Master category created successfully", masterCategory));
});

export const getMasterCategories = asyncHandler(async (_req: Request, res: Response) => {
  const data = await MasterCategoryModel.find().sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse("Master categories fetched successfully", data));
});

export const getSingleMasterCategory = asyncHandler(async (req: Request, res: Response) => {
  const item = await MasterCategoryModel.findById(req.params.id);

  if (!item) {
    throw new ApiError(404, "Master category not found");
  }

  res
    .status(200)
    .json(new ApiResponse("Master category fetched successfully", item));
});

export const updateMasterCategory = asyncHandler(async (req: Request, res: Response) => {
  const item = await MasterCategoryModel.findById(req.params.id);

  if (!item) {
    throw new ApiError(404, "Master category not found");
  }

  const { name, slug, isActive } = req.body;

  if (name) {
    item.name = name;
  }

  if (slug || name) {
    const finalSlug = slugify(slug || item.name);
    const exists = await MasterCategoryModel.findOne({
      slug: finalSlug,
      _id: { $ne: item._id },
    });

    if (exists) {
      throw new ApiError(400, "Master category slug already exists");
    }

    item.slug = finalSlug;
  }

  if (typeof isActive === "boolean") {
    item.isActive = isActive;
  }

  await item.save();

  res
    .status(200)
    .json(new ApiResponse("Master category updated successfully", item));
});

export const deleteMasterCategory = asyncHandler(async (req: Request, res: Response) => {
  const item = await MasterCategoryModel.findById(req.params.id);

  if (!item) {
    throw new ApiError(404, "Master category not found");
  }

  await item.deleteOne();

  res.status(200).json(new ApiResponse("Master category deleted successfully"));
});
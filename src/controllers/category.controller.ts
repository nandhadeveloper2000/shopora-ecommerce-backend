import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { CategoryModel } from "../models/category.model";
import { MasterCategoryModel } from "../models/masterCategory.model";
import { slugify } from "../utils/slugify";

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, masterCategoryId, isActive } = req.body;

  if (!name || !masterCategoryId) {
    throw new ApiError(400, "Name and masterCategoryId are required");
  }

  const masterCategory = await MasterCategoryModel.findById(masterCategoryId);
  if (!masterCategory) {
    throw new ApiError(404, "Master category not found");
  }

  const finalSlug = slugify(slug || name);

  const existing = await CategoryModel.findOne({
    masterCategoryId,
    slug: finalSlug,
  });

  if (existing) {
    throw new ApiError(400, "Category already exists under this master category");
  }

  const category = await CategoryModel.create({
    name,
    slug: finalSlug,
    masterCategoryId,
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  res.status(201).json(new ApiResponse("Category created successfully", category));
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const data = await CategoryModel.find()
    .populate("masterCategoryId", "name slug")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("Categories fetched successfully", data));
});

export const getSingleCategory = asyncHandler(async (req: Request, res: Response) => {
  const item = await CategoryModel.findById(req.params.id).populate(
    "masterCategoryId",
    "name slug"
  );

  if (!item) {
    throw new ApiError(404, "Category not found");
  }

  res.status(200).json(new ApiResponse("Category fetched successfully", item));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const item = await CategoryModel.findById(req.params.id);

  if (!item) {
    throw new ApiError(404, "Category not found");
  }

  const { name, slug, masterCategoryId, isActive } = req.body;

  if (masterCategoryId) {
    const masterCategory = await MasterCategoryModel.findById(masterCategoryId);
    if (!masterCategory) {
      throw new ApiError(404, "Master category not found");
    }
    item.masterCategoryId = masterCategoryId;
  }

  if (name) {
    item.name = name;
  }

  if (slug || name) {
    const finalSlug = slugify(slug || item.name);

    const exists = await CategoryModel.findOne({
      masterCategoryId: item.masterCategoryId,
      slug: finalSlug,
      _id: { $ne: item._id },
    });

    if (exists) {
      throw new ApiError(400, "Category slug already exists under this master category");
    }

    item.slug = finalSlug;
  }

  if (typeof isActive === "boolean") {
    item.isActive = isActive;
  }

  await item.save();

  res.status(200).json(new ApiResponse("Category updated successfully", item));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const item = await CategoryModel.findById(req.params.id);

  if (!item) {
    throw new ApiError(404, "Category not found");
  }

  await item.deleteOne();

  res.status(200).json(new ApiResponse("Category deleted successfully"));
});
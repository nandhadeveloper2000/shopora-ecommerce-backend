import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { BrandModel } from "../models/brand.model";
import { slugify } from "../utils/slugify";

export const createBrand = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, isActive } = req.body;

  if (!name) {
    throw new ApiError(400, "Name is required");
  }

  const finalSlug = slugify(slug || name);

  const existing = await BrandModel.findOne({ slug: finalSlug });
  if (existing) {
    throw new ApiError(400, "Brand already exists");
  }

  const brand = await BrandModel.create({
    name,
    slug: finalSlug,
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  res.status(201).json(new ApiResponse("Brand created successfully", brand));
});

export const getBrands = asyncHandler(async (_req: Request, res: Response) => {
  const data = await BrandModel.find().sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("Brands fetched successfully", data));
});

export const getSingleBrand = asyncHandler(async (req: Request, res: Response) => {
  const item = await BrandModel.findById(req.params.id);

  if (!item) {
    throw new ApiError(404, "Brand not found");
  }

  res.status(200).json(new ApiResponse("Brand fetched successfully", item));
});

export const updateBrand = asyncHandler(async (req: Request, res: Response) => {
  const item = await BrandModel.findById(req.params.id);

  if (!item) {
    throw new ApiError(404, "Brand not found");
  }

  const { name, slug, isActive } = req.body;

  if (name) {
    item.name = name;
  }

  if (slug || name) {
    const finalSlug = slugify(slug || item.name);
    const exists = await BrandModel.findOne({
      slug: finalSlug,
      _id: { $ne: item._id },
    });

    if (exists) {
      throw new ApiError(400, "Brand slug already exists");
    }

    item.slug = finalSlug;
  }

  if (typeof isActive === "boolean") {
    item.isActive = isActive;
  }

  await item.save();

  res.status(200).json(new ApiResponse("Brand updated successfully", item));
});

export const deleteBrand = asyncHandler(async (req: Request, res: Response) => {
  const item = await BrandModel.findById(req.params.id);

  if (!item) {
    throw new ApiError(404, "Brand not found");
  }

  await item.deleteOne();

  res.status(200).json(new ApiResponse("Brand deleted successfully"));
});
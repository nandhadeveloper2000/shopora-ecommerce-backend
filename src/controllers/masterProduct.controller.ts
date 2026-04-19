import { Request, Response } from "express";
import { MasterProductModel } from "../models/masterProduct.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

export const createMasterProduct = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    slug,
    shortDescription,
    description,
    masterCategoryId,
    categoryId,
    brandId,
    modelName,
    skuCode,
    images,
    specs,
    tags,
    isActive,
  } = req.body;

  const existing = await MasterProductModel.findOne({
    $or: [{ slug }, { skuCode }],
  });

  if (existing) {
    throw new ApiError(400, "Master product with slug or SKU already exists");
  }

  const product = await MasterProductModel.create({
    title,
    slug,
    shortDescription,
    description,
    masterCategoryId,
    categoryId,
    brandId,
    modelName,
    skuCode,
    images: images || [],
    specs: specs || [],
    tags: tags || [],
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  res.status(201).json(new ApiResponse("Master product created successfully", product));
});

export const getMasterProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await MasterProductModel.find()
    .populate("masterCategoryId")
    .populate("categoryId")
    .populate("brandId")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("Master products fetched successfully", products));
});

export const getSingleMasterProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await MasterProductModel.findById(req.params.id)
    .populate("masterCategoryId")
    .populate("categoryId")
    .populate("brandId");

  if (!product) {
    throw new ApiError(404, "Master product not found");
  }

  res.status(200).json(new ApiResponse("Master product fetched successfully", product));
});

export const updateMasterProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await MasterProductModel.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Master product not found");
  }

  const {
    title,
    slug,
    shortDescription,
    description,
    masterCategoryId,
    categoryId,
    brandId,
    modelName,
    skuCode,
    images,
    specs,
    tags,
    isActive,
  } = req.body;

  if (slug || skuCode) {
    const existing = await MasterProductModel.findOne({
      _id: { $ne: product._id },
      $or: [
        ...(slug ? [{ slug }] : []),
        ...(skuCode ? [{ skuCode }] : []),
      ],
    });

    if (existing) {
      throw new ApiError(400, "Another product already uses this slug or SKU");
    }
  }

  if (title !== undefined) product.title = title;
  if (slug !== undefined) product.slug = slug;
  if (shortDescription !== undefined) product.shortDescription = shortDescription;
  if (description !== undefined) product.description = description;
  if (masterCategoryId !== undefined) product.masterCategoryId = masterCategoryId;
  if (categoryId !== undefined) product.categoryId = categoryId;
  if (brandId !== undefined) product.brandId = brandId;
  if (modelName !== undefined) product.modelName = modelName;
  if (skuCode !== undefined) product.skuCode = skuCode;
  if (images !== undefined) product.images = images;
  if (specs !== undefined) product.specs = specs;
  if (tags !== undefined) product.tags = tags;
  if (typeof isActive === "boolean") product.isActive = isActive;

  await product.save();

  res.status(200).json(new ApiResponse("Master product updated successfully", product));
});

export const deleteMasterProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await MasterProductModel.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Master product not found");
  }

  await product.deleteOne();

  res.status(200).json(new ApiResponse("Master product deleted successfully"));
});
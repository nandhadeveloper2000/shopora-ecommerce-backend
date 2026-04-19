import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { ShopModel } from "../models/shop.model";
import { AuthRequest } from "../middlewares/auth.middleware";
import { slugify } from "../utils/slugify";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload";
import { ROLES } from "../constants/roles";

export const createShop = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  if (user.role !== ROLES.VENDOR && user.role !== ROLES.ADMIN && user.role !== ROLES.MASTER_ADMIN) {
    throw new ApiError(403, "Only vendor/admin can create shop");
  }

  const { name, slug } = req.body;

  if (!name) {
    throw new ApiError(400, "Shop name is required");
  }

  const finalSlug = slugify(slug || name);

  const exists = await ShopModel.findOne({ slug: finalSlug });
  if (exists) {
    throw new ApiError(400, "Shop slug already exists");
  }

  let logo = "";
  let logoPublicId = "";

  const file = req.file;
  if (file) {
    const uploaded = await uploadToCloudinary(
      file.buffer,
      "multi-vendor/shops",
      file.mimetype
    );
    logo = uploaded.url;
    logoPublicId = uploaded.publicId;
  }

  const shop = await ShopModel.create({
    name,
    slug: finalSlug,
    ownerId: user.id,
    logo,
    logoPublicId,
    isActive: true,
  });

  res.status(201).json(new ApiResponse("Shop created successfully", shop));
});

export const getMyShops = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const shops = await ShopModel.find({ ownerId: user.id }).sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("My shops fetched successfully", shops));
});

export const getAllShops = asyncHandler(async (_req: Request, res: Response) => {
  const shops = await ShopModel.find()
    .populate("ownerId", "name email role")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("All shops fetched successfully", shops));
});

export const getSingleShop = asyncHandler(async (req: Request, res: Response) => {
  const shop = await ShopModel.findById(req.params.id).populate("ownerId", "name email role");

  if (!shop) {
    throw new ApiError(404, "Shop not found");
  }

  res.status(200).json(new ApiResponse("Shop fetched successfully", shop));
});

export const updateShop = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const shop = await ShopModel.findById(req.params.id);
  if (!shop) {
    throw new ApiError(404, "Shop not found");
  }

  const isOwner = String(shop.ownerId) === user.id;
  const isAdmin =
    user.role === ROLES.ADMIN || user.role === ROLES.MASTER_ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You can only update your own shop");
  }

  const { name, slug, isActive } = req.body;

  if (name) {
    shop.name = name;
  }

  if (slug || name) {
    const finalSlug = slugify(slug || shop.name);
    const exists = await ShopModel.findOne({
      slug: finalSlug,
      _id: { $ne: shop._id },
    });

    if (exists) {
      throw new ApiError(400, "Shop slug already exists");
    }

    shop.slug = finalSlug;
  }

  if (typeof isActive === "boolean" && isAdmin) {
    shop.isActive = isActive;
  }

  const file = req.file;
  if (file) {
    if ((shop as any).logoPublicId) {
      await deleteFromCloudinary((shop as any).logoPublicId);
    }

    const uploaded = await uploadToCloudinary(
      file.buffer,
      "multi-vendor/shops",
      file.mimetype
    );

    shop.logo = uploaded.url;
    (shop as any).logoPublicId = uploaded.publicId;
  }

  await shop.save();

  res.status(200).json(new ApiResponse("Shop updated successfully", shop));
});

export const deleteShop = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const shop = await ShopModel.findById(req.params.id);
  if (!shop || shop.isDeleted) {
    throw new ApiError(404, "Shop not found");
  }

  const isOwner = String(shop.ownerId) === user.id;
  const isAdmin = user.role === ROLES.ADMIN || user.role === ROLES.MASTER_ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You can only delete your own shop");
  }

  shop.isDeleted = true;
  shop.deletedAt = new Date();
  shop.isActive = false;
  await shop.save();

  res.status(200).json(new ApiResponse("Shop deleted successfully"));
});
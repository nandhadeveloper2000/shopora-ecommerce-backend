import { Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middlewares/auth.middleware";
import { WishlistModel } from "../models/wishlist.model";
import { MasterProductModel } from "../models/masterProduct.model";
import { VendorListingModel } from "../models/vendorListing.model";

async function buildWishlistResponse(userId: string) {
  const wishlist = await WishlistModel.findOne({ userId }).lean();

  if (!wishlist) {
    return { items: [] };
  }

  const productIds = wishlist.items.map((item) => item.masterProductId);

  const products = await MasterProductModel.find({
    _id: { $in: productIds },
    isActive: true,
  })
    .populate("brandId", "name slug")
    .populate("categoryId", "name slug")
    .lean();

  const items = await Promise.all(
    products.map(async (product: any) => {
      const bestListing = await VendorListingModel.findOne({
        masterProductId: product._id,
        isActive: true,
        isApproved: true,
        stock: { $gt: 0 },
      })
        .populate("shopId", "name slug logo isActive")
        .sort({ sellingPrice: 1, createdAt: -1 })
        .lean();

      if (bestListing && !(bestListing.shopId as any)?.isActive) {
        return {
          product,
          bestListing: null,
        };
      }

      return {
        product,
        bestListing,
      };
    })
  );

  return { items };
}

export const getMyWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const data = await buildWishlistResponse(userId);

  res.status(200).json(new ApiResponse("Wishlist fetched successfully", data));
});

export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { masterProductId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(masterProductId)) {
    throw new ApiError(400, "Invalid masterProductId");
  }

  const product = await MasterProductModel.findOne({
    _id: masterProductId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  let wishlist = await WishlistModel.findOne({ userId });

  if (!wishlist) {
    wishlist = await WishlistModel.create({
      userId,
      items: [{ masterProductId }],
    });
  } else {
    const exists = wishlist.items.some(
      (item) => String(item.masterProductId) === String(masterProductId)
    );

    if (!exists) {
      wishlist.items.push({ masterProductId });
      await wishlist.save();
    }
  }

  const data = await buildWishlistResponse(userId);

  res.status(200).json(new ApiResponse("Item added to wishlist successfully", data));
});

export const removeWishlistItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { masterProductId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(masterProductId)) {
    throw new ApiError(400, "Invalid masterProductId");
  }

  const wishlist = await WishlistModel.findOne({ userId });
  if (!wishlist) {
    throw new ApiError(404, "Wishlist not found");
  }

  wishlist.items = wishlist.items.filter(
    (item) => String(item.masterProductId) !== String(masterProductId)
  );

  await wishlist.save();

  const data = await buildWishlistResponse(userId);

  res.status(200).json(new ApiResponse("Wishlist item removed successfully", data));
});

export const clearWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const wishlist = await WishlistModel.findOne({ userId });

  if (wishlist) {
    wishlist.items = [];
    await wishlist.save();
  }

  const data = await buildWishlistResponse(userId);

  res.status(200).json(new ApiResponse("Wishlist cleared successfully", data));
});
import { Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CartModel } from "../models/cart.model";
import { VendorListingModel } from "../models/vendorListing.model";

async function buildCartResponse(userId: string) {
  const cart = await CartModel.findOne({ userId }).lean();

  if (!cart) {
    return {
      items: [],
      summary: {
        totalItems: 0,
        subtotal: 0,
        shippingTotal: 0,
        grandTotal: 0,
      },
    };
  }

  const listingIds = cart.items.map((item) => item.vendorListingId);
  const listings = await VendorListingModel.find({
    _id: { $in: listingIds },
    isActive: true,
    isApproved: true,
  })
    .populate("masterProductId")
    .populate("shopId", "name slug logo isActive")
    .lean();

  const listingMap = new Map<string, any>();
  for (const listing of listings) {
    listingMap.set(String(listing._id), listing);
  }

  let subtotal = 0;
  let shippingTotal = 0;
  let totalItems = 0;

  const items = cart.items
    .map((item) => {
      const listing = listingMap.get(String(item.vendorListingId));
      if (!listing) return null;
      if (!listing.shopId || !(listing.shopId as any).isActive) return null;

      const quantity = item.quantity;
      const itemSubtotal = Number(listing.sellingPrice) * quantity;
      const itemShipping = Number(listing.shippingCharge || 0) * quantity;

      subtotal += itemSubtotal;
      shippingTotal += itemShipping;
      totalItems += quantity;

      return {
        vendorListingId: listing._id,
        quantity,
        itemSubtotal,
        itemShipping,
        listing: {
          _id: listing._id,
          sellingPrice: listing.sellingPrice,
          mrp: listing.mrp,
          stock: listing.stock,
          minOrderQty: listing.minOrderQty,
          offerText: listing.offerText,
          shippingCharge: listing.shippingCharge || 0,
          estimatedDeliveryDays: listing.estimatedDeliveryDays || 3,
          images: listing.images || [],
        },
        product: listing.masterProductId,
        shop: listing.shopId,
      };
    })
    .filter(Boolean);

  return {
    items,
    summary: {
      totalItems,
      subtotal,
      shippingTotal,
      grandTotal: subtotal + shippingTotal,
    },
  };
}

export const getMyCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const data = await buildCartResponse(userId);

  res.status(200).json(new ApiResponse("Cart fetched successfully", data));
});

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { vendorListingId, quantity } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vendorListingId)) {
    throw new ApiError(400, "Invalid vendorListingId");
  }

  const qty = Math.max(Number(quantity || 1), 1);

  const listing = await VendorListingModel.findOne({
    _id: vendorListingId,
    isActive: true,
    isApproved: true,
  }).populate("shopId", "isActive");

  if (!listing) {
    throw new ApiError(404, "Vendor listing not found");
  }

  if (!(listing.shopId as any)?.isActive) {
    throw new ApiError(400, "Shop is inactive");
  }

  if (listing.stock < qty) {
    throw new ApiError(400, "Insufficient stock");
  }

  let cart = await CartModel.findOne({ userId });

  if (!cart) {
    cart = await CartModel.create({
      userId,
      items: [{ vendorListingId, quantity: qty }],
    });
  } else {
    const existingItem = cart.items.find(
      (item) => String(item.vendorListingId) === String(vendorListingId)
    );

    if (existingItem) {
      const nextQty = existingItem.quantity + qty;
      if (listing.stock < nextQty) {
        throw new ApiError(400, "Requested quantity exceeds stock");
      }
      existingItem.quantity = nextQty;
    } else {
      cart.items.push({ vendorListingId, quantity: qty });
    }

    await cart.save();
  }

  const data = await buildCartResponse(userId);

  res.status(200).json(new ApiResponse("Item added to cart successfully", data));
});

export const updateCartItemQuantity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { vendorListingId, quantity } = req.body;

  if (!mongoose.Types.ObjectId.isValid(vendorListingId)) {
    throw new ApiError(400, "Invalid vendorListingId");
  }

  const qty = Number(quantity);

  if (!qty || qty < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const listing = await VendorListingModel.findOne({
    _id: vendorListingId,
    isActive: true,
    isApproved: true,
  });

  if (!listing) {
    throw new ApiError(404, "Vendor listing not found");
  }

  if (listing.stock < qty) {
    throw new ApiError(400, "Requested quantity exceeds stock");
  }

  const cart = await CartModel.findOne({ userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const existingItem = cart.items.find(
    (item) => String(item.vendorListingId) === String(vendorListingId)
  );

  if (!existingItem) {
    throw new ApiError(404, "Cart item not found");
  }

  existingItem.quantity = qty;
  await cart.save();

  const data = await buildCartResponse(userId);

  res.status(200).json(new ApiResponse("Cart item updated successfully", data));
});

export const removeCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const { vendorListingId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vendorListingId)) {
    throw new ApiError(400, "Invalid vendorListingId");
  }

  const cart = await CartModel.findOne({ userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => String(item.vendorListingId) !== String(vendorListingId)
  );

  await cart.save();

  const data = await buildCartResponse(userId);

  res.status(200).json(new ApiResponse("Cart item removed successfully", data));
});

export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const cart = await CartModel.findOne({ userId });

  if (cart) {
    cart.items = [];
    await cart.save();
  }

  const data = await buildCartResponse(userId);

  res.status(200).json(new ApiResponse("Cart cleared successfully", data));
});
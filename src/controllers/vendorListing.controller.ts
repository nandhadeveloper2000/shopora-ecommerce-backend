import { Response } from "express";
import { VendorListingModel } from "../models/vendorListing.model";
import { MasterProductModel } from "../models/masterProduct.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middlewares/auth.middleware";

export const createVendorListing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { shopId, masterProductId, sellingPrice, mrp, stock, minOrderQty, images, offerText } =
    req.body;

  const vendorId = req.user?.id;
  if (!vendorId) {
    throw new ApiError(401, "Unauthorized");
  }

  const masterProduct = await MasterProductModel.findById(masterProductId);
  if (!masterProduct) {
    throw new ApiError(404, "Master product not found");
  }

  const alreadyExists = await VendorListingModel.findOne({
    shopId,
    masterProductId
  });

  if (alreadyExists) {
    throw new ApiError(400, "Listing already exists for this shop and product");
  }

  const listing = await VendorListingModel.create({
    shopId,
    vendorId,
    masterProductId,
    sellingPrice,
    mrp,
    stock,
    minOrderQty,
    images: images || [],
    offerText: offerText || ""
  });

  res.status(201).json(new ApiResponse("Vendor listing created successfully", listing));
});

export const getVendorListings = asyncHandler(async (_req, res: Response) => {
  const listings = await VendorListingModel.find()
    .populate("shopId")
    .populate("vendorId", "name email")
    .populate("masterProductId")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse("Vendor listings fetched successfully", listings));
});
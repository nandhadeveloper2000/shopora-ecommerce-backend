import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { MasterProductModel } from "../models/masterProduct.model";
import { VendorListingModel } from "../models/vendorListing.model";

export const getCustomerProducts = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.max(Number(req.query.limit || 12), 1);
  const skip = (page - 1) * limit;

  const q = String(req.query.q || "").trim();
  const brandId = String(req.query.brandId || "").trim();
  const categoryId = String(req.query.categoryId || "").trim();
  const masterCategoryId = String(req.query.masterCategoryId || "").trim();
  const minPrice = Number(req.query.minPrice || 0);
  const maxPrice = Number(req.query.maxPrice || 0);
  const sort = String(req.query.sort || "newest").trim();

  const productMatch: Record<string, unknown> = {
    isActive: true,
  };

  if (q) {
    productMatch.$or = [
      { title: { $regex: q, $options: "i" } },
      { shortDescription: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $elemMatch: { $regex: q, $options: "i" } } },
      { modelName: { $regex: q, $options: "i" } },
      { skuCode: { $regex: q, $options: "i" } },
    ];
  }

  if (brandId && mongoose.Types.ObjectId.isValid(brandId)) {
    productMatch.brandId = new mongoose.Types.ObjectId(brandId);
  }

  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    productMatch.categoryId = new mongoose.Types.ObjectId(categoryId);
  }

  if (masterCategoryId && mongoose.Types.ObjectId.isValid(masterCategoryId)) {
    productMatch.masterCategoryId = new mongoose.Types.ObjectId(masterCategoryId);
  }

  const listingMatch: Record<string, unknown> = {
    isActive: true,
    isApproved: true,
    stock: { $gt: 0 },
  };

  if (minPrice > 0 || maxPrice > 0) {
    listingMatch.sellingPrice = {};
    if (minPrice > 0) (listingMatch.sellingPrice as Record<string, number>).$gte = minPrice;
    if (maxPrice > 0) (listingMatch.sellingPrice as Record<string, number>).$lte = maxPrice;
  }

  let sortStage: Record<string, 1 | -1> = { createdAt: -1 };

  if (sort === "price_asc") sortStage = { bestPrice: 1 };
  if (sort === "price_desc") sortStage = { bestPrice: -1 };
  if (sort === "newest") sortStage = { createdAt: -1 };
  if (sort === "title_asc") sortStage = { title: 1 };
  if (sort === "title_desc") sortStage = { title: -1 };

  const pipeline = [
    { $match: productMatch },
    {
      $lookup: {
        from: "vendorlistings",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              ...listingMatch,
              $expr: { $eq: ["$masterProductId", "$$productId"] },
            },
          },
          {
            $lookup: {
              from: "shops",
              localField: "shopId",
              foreignField: "_id",
              as: "shop",
            },
          },
          { $unwind: "$shop" },
          {
            $match: {
              "shop.isActive": true,
            },
          },
          { $sort: { sellingPrice: 1, createdAt: -1 } },
        ],
        as: "activeListings",
      },
    },
    {
      $addFields: {
        listingCount: { $size: "$activeListings" },
        bestListing: { $arrayElemAt: ["$activeListings", 0] },
      },
    },
    {
      $match: {
        listingCount: { $gt: 0 },
      },
    },
    {
      $addFields: {
        bestPrice: "$bestListing.sellingPrice",
        bestMrp: "$bestListing.mrp",
        discountPercent: {
          $cond: [
            { $gt: ["$bestListing.mrp", 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $subtract: [
                            "$bestListing.mrp",
                            "$bestListing.sellingPrice",
                          ],
                        },
                        "$bestListing.mrp",
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        title: 1,
        slug: 1,
        shortDescription: 1,
        description: 1,
        modelName: 1,
        skuCode: 1,
        images: 1,
        tags: 1,
        createdAt: 1,
        updatedAt: 1,
        brandId: 1,
        categoryId: 1,
        masterCategoryId: 1,
        listingCount: 1,
        bestPrice: 1,
        bestMrp: 1,
        discountPercent: 1,
        bestListing: {
          _id: 1,
          sellingPrice: 1,
          mrp: 1,
          stock: 1,
          offerText: 1,
          shippingCharge: 1,
          estimatedDeliveryDays: 1,
          images: 1,
          shopId: 1,
          shop: {
            _id: "$bestListing.shop._id",
            name: "$bestListing.shop.name",
            slug: "$bestListing.shop.slug",
            logo: "$bestListing.shop.logo",
          },
        },
      },
    },
    { $sort: sortStage },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await MasterProductModel.aggregate(pipeline);
  const items = result[0]?.items || [];
  const total = result[0]?.totalCount?.[0]?.count || 0;

  res.status(200).json(
    new ApiResponse("Customer products fetched successfully", {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  );
});

export const getCustomerProductDetails = asyncHandler(async (req: Request, res: Response) => {
  const productId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product id");
  }

  const product = await MasterProductModel.findOne({
    _id: productId,
    isActive: true,
  })
    .populate("brandId", "name slug")
    .populate("categoryId", "name slug")
    .populate("masterCategoryId", "name slug");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const listings = await VendorListingModel.find({
    masterProductId: product._id,
    isActive: true,
    isApproved: true,
    stock: { $gt: 0 },
  })
    .populate("shopId", "name slug logo isActive")
    .sort({ sellingPrice: 1, createdAt: -1 });

  const activeListings = listings.filter((item: any) => item.shopId?.isActive);

  const bestListing = activeListings[0] || null;

  const relatedProducts = await MasterProductModel.aggregate([
    {
      $match: {
        _id: { $ne: product._id },
        isActive: true,
        categoryId: product.categoryId,
      },
    },
    {
      $lookup: {
        from: "vendorlistings",
        let: { productId: "$_id" },
        pipeline: [
          {
            $match: {
              isActive: true,
              isApproved: true,
              stock: { $gt: 0 },
              $expr: { $eq: ["$masterProductId", "$$productId"] },
            },
          },
          { $sort: { sellingPrice: 1 } },
        ],
        as: "listings",
      },
    },
    {
      $addFields: {
        bestListing: { $arrayElemAt: ["$listings", 0] },
      },
    },
    {
      $match: {
        bestListing: { $ne: null },
      },
    },
    {
      $project: {
        title: 1,
        slug: 1,
        images: 1,
        bestListing: {
          _id: 1,
          sellingPrice: 1,
          mrp: 1,
        },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 8 },
  ]);

  res.status(200).json(
    new ApiResponse("Customer product details fetched successfully", {
      product,
      bestListing,
      listings: activeListings,
      relatedProducts,
    })
  );
});
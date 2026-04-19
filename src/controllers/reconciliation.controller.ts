import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { VendorListingModel } from "../models/vendorListing.model";
import { InventoryBalanceModel } from "../models/inventoryBalance.model";

export const getStockReconciliationReport = asyncHandler(async (_req: Request, res: Response) => {
  const listings = await VendorListingModel.find().lean();
  const balances = await InventoryBalanceModel.find().lean();

  const balanceMap = new Map<string, number>();

  for (const bal of balances as any[]) {
    const key = String(bal.vendorListingId);
    const prev = balanceMap.get(key) || 0;
    balanceMap.set(key, prev + Number(bal.quantityOnHand || 0));
  }

  const rows = listings.map((listing: any) => {
    const warehouseStock = balanceMap.get(String(listing._id)) || 0;
    const listingStock = Number(listing.stock || 0);

    return {
      vendorListingId: listing._id,
      listingStock,
      warehouseStock,
      difference: listingStock - warehouseStock,
    };
  });

  res.status(200).json(new ApiResponse("Stock reconciliation report fetched successfully", rows));
});
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { InventoryBalanceModel } from "../models/inventoryBalance.model";
import { LowStockAlertModel } from "../models/lowStockAlert.model";
import { WarehouseAllocationModel } from "../models/warehouseAllocation.model";
import { VendorFundAccountModel } from "../models/vendorFundAccount.model";

export const getMyInventoryDashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const vendorId = req.user?.id;
  if (!vendorId) {
    throw new ApiError(401, "Unauthorized");
  }

  const [balances, lowStock, allocations, fundAccounts] = await Promise.all([
    InventoryBalanceModel.find({ vendorId }).populate("warehouseId stockLocationId vendorListingId"),
    LowStockAlertModel.find({ vendorId, status: "OPEN" }),
    WarehouseAllocationModel.find({ vendorId }).sort({ createdAt: -1 }).limit(20),
    VendorFundAccountModel.find({ vendorId }).populate("shopId", "name slug"),
  ]);

  res.status(200).json(
    new ApiResponse("Vendor inventory dashboard fetched successfully", {
      balances,
      lowStock,
      allocations,
      fundAccounts,
    })
  );
});
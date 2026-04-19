import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { StockTransferModel } from "../models/stockTransfer.model";
import { VendorListingModel } from "../models/vendorListing.model";
import { InventoryLedgerModel } from "../models/inventoryLedger.model";
import { upsertInventoryBalance } from "../utils/inventoryBalance";
import { withTransaction } from "../utils/transaction";
import { getNextSequenceNumber, formatSequence } from "../utils/sequence";

export const createStockTransfer = asyncHandler(async (req: Request, res: Response) => {
  const {
    vendorId,
    shopId,
    fromWarehouseId,
    fromStockLocationId = null,
    toWarehouseId,
    toStockLocationId = null,
    items,
    note = "",
  } = req.body;

  if (!Array.isArray(items) || !items.length) {
    throw new ApiError(400, "Transfer items are required");
  }

  const seq = await getNextSequenceNumber("GRN");
  const transferNumber = formatSequence("TRF", seq.financialYear, seq.number);

  const transfer = await StockTransferModel.create({
    transferNumber,
    vendorId,
    shopId,
    fromWarehouseId,
    fromStockLocationId,
    toWarehouseId,
    toStockLocationId,
    items,
    status: "DRAFT",
    note,
  });

  res.status(201).json(new ApiResponse("Stock transfer created successfully", transfer));
});

export const completeStockTransfer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid transfer id");
  }

  const result = await withTransaction(async () => {
    const transfer = await StockTransferModel.findById(id);
    if (!transfer) {
      throw new ApiError(404, "Stock transfer not found");
    }

    if (transfer.status === "COMPLETED") {
      throw new ApiError(400, "Stock transfer already completed");
    }

    for (const line of transfer.items) {
      const listing = await VendorListingModel.findById(line.vendorListingId);
      if (!listing) {
        throw new ApiError(404, "Vendor listing not found");
      }

      await upsertInventoryBalance({
        vendorListingId: String(listing._id),
        masterProductId: String(listing.masterProductId),
        vendorId: String(listing.vendorId),
        shopId: String(listing.shopId),
        warehouseId: String(transfer.fromWarehouseId),
        stockLocationId: transfer.fromStockLocationId ? String(transfer.fromStockLocationId) : null,
        quantityDelta: -line.quantity,
      });

      await upsertInventoryBalance({
        vendorListingId: String(listing._id),
        masterProductId: String(listing.masterProductId),
        vendorId: String(listing.vendorId),
        shopId: String(listing.shopId),
        warehouseId: String(transfer.toWarehouseId),
        stockLocationId: transfer.toStockLocationId ? String(transfer.toStockLocationId) : null,
        quantityDelta: line.quantity,
      });

      await InventoryLedgerModel.create({
        vendorListingId: listing._id,
        masterProductId: listing.masterProductId,
        shopId: listing.shopId,
        vendorId: listing.vendorId,
        movementType: "MANUAL_REMOVE",
        quantityDelta: -line.quantity,
        stockBefore: Math.max(0, listing.stock),
        stockAfter: Math.max(0, listing.stock),
        referenceType: "SYSTEM",
        referenceId: transfer._id,
        note: `Stock transfer OUT ${transfer.transferNumber}`,
      });

      await InventoryLedgerModel.create({
        vendorListingId: listing._id,
        masterProductId: listing.masterProductId,
        shopId: listing.shopId,
        vendorId: listing.vendorId,
        movementType: "MANUAL_ADD",
        quantityDelta: line.quantity,
        stockBefore: Math.max(0, listing.stock),
        stockAfter: Math.max(0, listing.stock),
        referenceType: "SYSTEM",
        referenceId: transfer._id,
        note: `Stock transfer IN ${transfer.transferNumber}`,
      });
    }

    transfer.status = "COMPLETED";
    await transfer.save();

    return transfer;
  });

  res.status(200).json(new ApiResponse("Stock transfer completed successfully", result));
});
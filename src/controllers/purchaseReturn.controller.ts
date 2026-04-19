import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PurchaseReturnModel } from "../models/purchaseReturn.model";
import { VendorListingModel } from "../models/vendorListing.model";
import { InventoryLedgerModel } from "../models/inventoryLedger.model";
import { upsertInventoryBalance } from "../utils/inventoryBalance";
import { getNextSequenceNumber, formatSequence } from "../utils/sequence";

export const createPurchaseReturn = asyncHandler(async (req: Request, res: Response) => {
  const {
    purchaseOrderId = null,
    supplierName,
    vendorId,
    shopId,
    warehouseId,
    items,
    note = "",
  } = req.body;

  if (!Array.isArray(items) || !items.length) {
    throw new ApiError(400, "Purchase return items are required");
  }

  const seq = await getNextSequenceNumber("GRN");
  const returnNumber = formatSequence("PRTN", seq.financialYear, seq.number);

  let totalAmount = 0;

  for (const line of items) {
    totalAmount += Number(line.quantity || 0) * Number(line.unitCost || 0);
  }

  const doc = await PurchaseReturnModel.create({
    returnNumber,
    purchaseOrderId,
    supplierName,
    vendorId,
    shopId,
    warehouseId,
    items,
    totalAmount,
    status: "DRAFT",
    note,
  });

  res.status(201).json(new ApiResponse("Purchase return created successfully", doc));
});

export const markPurchaseReturnReturned = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const doc = await PurchaseReturnModel.findById(id);
  if (!doc) {
    throw new ApiError(404, "Purchase return not found");
  }

  if (doc.status === "RETURNED") {
    throw new ApiError(400, "Purchase return already completed");
  }

  for (const line of doc.items) {
    const listing = await VendorListingModel.findById(line.vendorListingId);
    if (!listing) {
      throw new ApiError(404, "Vendor listing not found");
    }

    const before = listing.stock;
    const after = Math.max(0, before - Number(line.quantity || 0));
    const delta = after - before;

    listing.stock = after;
    await listing.save();

    await InventoryLedgerModel.create({
      vendorListingId: listing._id,
      masterProductId: listing.masterProductId,
      shopId: listing.shopId,
      vendorId: listing.vendorId,
      movementType: "MANUAL_REMOVE",
      quantityDelta: delta,
      stockBefore: before,
      stockAfter: after,
      referenceType: "SYSTEM",
      referenceId: doc._id,
      note: `Purchase return ${doc.returnNumber}`,
    });

    await upsertInventoryBalance({
      vendorListingId: String(listing._id),
      masterProductId: String(listing.masterProductId),
      vendorId: String(listing.vendorId),
      shopId: String(listing.shopId),
      warehouseId: String(doc.warehouseId),
      stockLocationId: null,
      quantityDelta: delta,
    });
  }

  doc.status = "RETURNED";
  await doc.save();

  res.status(200).json(new ApiResponse("Purchase return marked as returned", doc));
});
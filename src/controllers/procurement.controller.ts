import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { PurchaseOrderModel } from "../models/purchaseOrder.model";
import { GrnModel } from "../models/grn.model";
import { VendorListingModel } from "../models/vendorListing.model";
import { InventoryLedgerModel } from "../models/inventoryLedger.model";
import { upsertInventoryBalance } from "../utils/inventoryBalance";
import { getNextSequenceNumber, formatSequence } from "../utils/sequence";
import { withTransaction } from "../utils/transaction";
import { StockBatchModel } from "../models/stockBatch.model";

export const createPurchaseOrder = asyncHandler(async (req: Request, res: Response) => {
  const { supplierName, supplierMobile, supplierEmail, vendorId, shopId, warehouseId, items, note = "" } = req.body;

  if (!Array.isArray(items) || !items.length) {
    throw new ApiError(400, "PO items are required");
  }

  const seq = await getNextSequenceNumber("PO");
  const poNumber = formatSequence("PO", seq.financialYear, seq.number);

  let subtotal = 0;
  let taxAmount = 0;

  const lines = items.map((item: any) => {
    const qty = Number(item.quantity || 0);
    const unitCost = Number(item.unitCost || 0);
    const taxPercent = Number(item.taxPercent || 0);
    const base = qty * unitCost;
    const tax = (base * taxPercent) / 100;
    const lineTotal = base + tax;

    subtotal += base;
    taxAmount += tax;

    return {
      vendorListingId: item.vendorListingId,
      quantity: qty,
      unitCost,
      taxPercent,
      lineTotal,
    };
  });

  const po = await PurchaseOrderModel.create({
    poNumber,
    supplierName,
    supplierMobile: supplierMobile || "",
    supplierEmail: supplierEmail || "",
    vendorId,
    shopId,
    warehouseId,
    items: lines,
    subtotal,
    taxAmount,
    grandTotal: subtotal + taxAmount,
    status: "DRAFT",
    note,
  });

  res.status(201).json(new ApiResponse("Purchase order created successfully", po));
});

export const receiveGrn = asyncHandler(async (req: Request, res: Response) => {
  const {
    purchaseOrderId = null,
    vendorId,
    shopId,
    warehouseId,
    stockLocationId = null,
    items,
    note = "",
  } = req.body;

  if (!Array.isArray(items) || !items.length) {
    throw new ApiError(400, "GRN items are required");
  }

  const seq = await getNextSequenceNumber("GRN");
  const grnNumber = formatSequence("GRN", seq.financialYear, seq.number);

  const result = await withTransaction(async () => {
    const grn = await GrnModel.create({
      grnNumber,
      purchaseOrderId,
      vendorId,
      shopId,
      warehouseId,
      stockLocationId,
      items,
      note,
    });

    for (const item of items) {
      const listing = await VendorListingModel.findById(item.vendorListingId);
      if (!listing) {
        throw new ApiError(404, "Vendor listing not found in GRN");
      }

      const acceptedQty = Number(item.acceptedQty || 0);
      const before = listing.stock;

      listing.stock += acceptedQty;
      await listing.save();

      await InventoryLedgerModel.create({
        vendorListingId: listing._id,
        masterProductId: listing.masterProductId,
        shopId: listing.shopId,
        vendorId: listing.vendorId,
        movementType: "MANUAL_ADD",
        quantityDelta: acceptedQty,
        stockBefore: before,
        stockAfter: listing.stock,
        referenceType: "SYSTEM",
        referenceId: grn._id,
        note: `GRN inward ${grnNumber}`,
      });

      await upsertInventoryBalance({
        vendorListingId: String(listing._id),
        masterProductId: String(listing.masterProductId),
        vendorId: String(listing.vendorId),
        shopId: String(listing.shopId),
        warehouseId: String(warehouseId),
        stockLocationId: stockLocationId ? String(stockLocationId) : null,
        onHandDelta: acceptedQty,
      });

      await StockBatchModel.create({
        vendorListingId: listing._id,
        vendorId: listing.vendorId,
        shopId: listing.shopId,
        warehouseId,
        stockLocationId,
        batchNumber: item.batchNumber || `${grnNumber}-${String(listing._id).slice(-6)}`,
        mfgDate: item.mfgDate || null,
        expiryDate: item.expiryDate || null,
        inwardQty: acceptedQty,
        availableQty: acceptedQty,
        unitCost: item.unitCost,
        sourceType: "GRN",
        sourceId: grn._id,
        status: "ACTIVE",
      });
    }

    if (purchaseOrderId) {
      const po = await PurchaseOrderModel.findById(purchaseOrderId);
      if (po) {
        for (const line of items) {
          const poLine = po.items.find(
            (poItem: any) => String(poItem.vendorListingId) === String(line.vendorListingId)
          );
          if (poLine) {
            poLine.receivedQty += Number(line.acceptedQty || 0);
            poLine.pendingQty = Math.max(0, poLine.quantity - poLine.receivedQty);
          }
        }

        const allReceived = po.items.every((x: any) => x.pendingQty === 0);
        const anyReceived = po.items.some((x: any) => x.receivedQty > 0);

        po.status = allReceived ? "RECEIVED" : anyReceived ? "PART_RECEIVED" : po.status;
        await po.save();
      }
    }

    return grn;
  });

  res.status(201).json(new ApiResponse("GRN received successfully", result));
});
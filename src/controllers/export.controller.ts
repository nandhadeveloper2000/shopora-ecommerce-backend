import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { SettlementLedgerModel } from "../models/settlementLedger.model";
import { InventoryLedgerModel } from "../models/inventoryLedger.model";
import { OrderModel } from "../models/order.model";

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const value = row[h] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  return lines.join("\n");
}

export const exportSettlementCsv = asyncHandler(async (_req: Request, res: Response) => {
  const items = await SettlementLedgerModel.find().lean();

  const rows = items.map((item: any) => ({
    id: item._id,
    orderId: item.orderId,
    shopId: item.shopId,
    vendorId: item.vendorId,
    grossAmount: item.grossAmount,
    shippingAmount: item.shippingAmount,
    taxAmount: item.taxAmount,
    discountShare: item.discountShare,
    platformFee: item.platformFee,
    gatewayFee: item.gatewayFee,
    netPayable: item.netPayable,
    settlementStatus: item.settlementStatus,
    payoutReference: item.payoutReference,
    createdAt: item.createdAt,
  }));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="settlements.csv"');
  res.send(toCsv(rows));
});

export const exportInventoryCsv = asyncHandler(async (_req: Request, res: Response) => {
  const items = await InventoryLedgerModel.find().lean();

  const rows = items.map((item: any) => ({
    id: item._id,
    vendorListingId: item.vendorListingId,
    masterProductId: item.masterProductId,
    vendorId: item.vendorId,
    shopId: item.shopId,
    movementType: item.movementType,
    quantityDelta: item.quantityDelta,
    stockBefore: item.stockBefore,
    stockAfter: item.stockAfter,
    referenceType: item.referenceType,
    referenceId: item.referenceId,
    note: item.note,
    createdAt: item.createdAt,
  }));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="inventory-ledger.csv"');
  res.send(toCsv(rows));
});

export const exportGstCsv = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await OrderModel.find().lean();

  const rows = orders.map((item: any) => ({
    orderId: item._id,
    orderNumber: item.orderNumber,
    subtotal: item.subtotal,
    shippingTotal: item.shippingTotal,
    discountAmount: item.discountAmount,
    taxAmount: item.taxAmount,
    grandTotal: item.grandTotal,
    paymentStatus: item.paymentStatus,
    createdAt: item.createdAt,
  }));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="gst-summary.csv"');
  res.send(toCsv(rows));
});
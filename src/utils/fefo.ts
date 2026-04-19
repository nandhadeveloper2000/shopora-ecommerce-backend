import { StockBatchModel } from "../models/stockBatch.model";

export async function allocateFefoBatches(params: {
  vendorListingId: string;
  warehouseId: string;
  stockLocationId?: string | null;
  requiredQty: number;
}) {
  const { vendorListingId, warehouseId, stockLocationId = null, requiredQty } = params;

  let remaining = requiredQty;

  const batches = await StockBatchModel.find({
    vendorListingId,
    warehouseId,
    stockLocationId,
    status: "ACTIVE",
    availableQty: { $gt: 0 },
  }).sort({
    expiryDate: 1,
    createdAt: 1,
  });

  const allocations: Array<{
    batchId: string;
    batchNumber: string;
    qty: number;
  }> = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const take = Math.min(batch.availableQty, remaining);
    if (take <= 0) continue;

    allocations.push({
      batchId: String(batch._id),
      batchNumber: batch.batchNumber,
      qty: take,
    });

    remaining -= take;
  }

  if (remaining > 0) {
    throw new Error("Insufficient FEFO batch stock");
  }

  return allocations;
}
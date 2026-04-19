import { InventoryBalanceModel } from "../models/inventoryBalance.model";

export async function recomputeInventoryAvailable(vendorListingId: string, warehouseId: string, stockLocationId?: string | null) {
  const item = await InventoryBalanceModel.findOne({
    vendorListingId,
    warehouseId,
    stockLocationId: stockLocationId || null,
  });

  if (!item) return null;

  item.availableQty = Math.max(0, item.quantityOnHand - item.reservedQty);
  await item.save();

  return item;
}
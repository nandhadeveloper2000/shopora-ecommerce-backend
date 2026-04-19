import { InventoryBalanceModel } from "../models/inventoryBalance.model";
import { LowStockAlertModel } from "../models/lowStockAlert.model";

export async function upsertInventoryBalance(params: {
  vendorListingId: string;
  masterProductId: string;
  vendorId: string;
  shopId: string;
  warehouseId: string;
  stockLocationId?: string | null;
  onHandDelta?: number;
  reservedDelta?: number;
}) {
  const {
    vendorListingId,
    masterProductId,
    vendorId,
    shopId,
    warehouseId,
    stockLocationId = null,
    onHandDelta = 0,
    reservedDelta = 0,
  } = params;

  const item = await InventoryBalanceModel.findOneAndUpdate(
    {
      vendorListingId,
      warehouseId,
      stockLocationId,
    },
    {
      $setOnInsert: {
        vendorListingId,
        masterProductId,
        vendorId,
        shopId,
        warehouseId,
        stockLocationId,
        quantityOnHand: 0,
        reservedQty: 0,
        availableQty: 0,
        reorderLevel: 5,
        lowStockThreshold: 3,
      },
      $inc: {
        quantityOnHand: onHandDelta,
        reservedQty: reservedDelta,
      },
    },
    { new: true, upsert: true }
  );

  item.quantityOnHand = Math.max(0, item.quantityOnHand);
  item.reservedQty = Math.max(0, item.reservedQty);
  item.availableQty = Math.max(0, item.quantityOnHand - item.reservedQty);
  await item.save();

  if (item.availableQty <= item.lowStockThreshold) {
    const existingOpen = await LowStockAlertModel.findOne({
      vendorListingId: item.vendorListingId,
      warehouseId: item.warehouseId,
      stockLocationId: item.stockLocationId,
      status: "OPEN",
    });

    if (!existingOpen) {
      await LowStockAlertModel.create({
        vendorListingId: item.vendorListingId,
        vendorId: item.vendorId,
        shopId: item.shopId,
        warehouseId: item.warehouseId,
        stockLocationId: item.stockLocationId,
        currentQty: item.availableQty,
        thresholdQty: item.lowStockThreshold,
        status: "OPEN",
      });
    }
  } else {
    await LowStockAlertModel.updateMany(
      {
        vendorListingId: item.vendorListingId,
        warehouseId: item.warehouseId,
        stockLocationId: item.stockLocationId,
        status: "OPEN",
      },
      { $set: { status: "RESOLVED" } }
    );
  }

  return item;
}
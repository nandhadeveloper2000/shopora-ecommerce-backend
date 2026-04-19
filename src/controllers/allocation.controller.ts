import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { OrderModel } from "../models/order.model";
import { InventoryBalanceModel } from "../models/inventoryBalance.model";
import { WarehouseAllocationModel } from "../models/warehouseAllocation.model";
import { InventoryReservationModel } from "../models/inventoryReservation.model";
import { upsertInventoryBalance } from "../utils/inventoryBalance";
import { withTransaction } from "../utils/transaction";

export const allocateOrderWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, vendorListingId, warehouseId, stockLocationId = null, quantity } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(orderId) ||
    !mongoose.Types.ObjectId.isValid(vendorListingId) ||
    !mongoose.Types.ObjectId.isValid(warehouseId)
  ) {
    throw new ApiError(400, "Invalid ids");
  }

  const qty = Number(quantity || 0);
  if (qty <= 0) {
    throw new ApiError(400, "Quantity must be greater than zero");
  }

  const result = await withTransaction(async () => {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const item: any = order.items.find(
      (line: any) => String(line.vendorListingId) === String(vendorListingId)
    );

    if (!item) {
      throw new ApiError(404, "Order item not found");
    }

    const balance = await InventoryBalanceModel.findOne({
      vendorListingId,
      warehouseId,
      stockLocationId,
    });

    if (!balance || balance.availableQty < qty) {
      throw new ApiError(400, "Insufficient available stock in selected warehouse");
    }

    const allocation = await WarehouseAllocationModel.create({
      orderId,
      vendorListingId,
      vendorId: item.vendorId,
      shopId: item.shopId,
      warehouseId,
      stockLocationId,
      allocatedQty: qty,
      pickedQty: 0,
      packedQty: 0,
      shippedQty: 0,
      status: "ALLOCATED",
    });

    await InventoryReservationModel.create({
      orderId,
      vendorListingId,
      vendorId: item.vendorId,
      shopId: item.shopId,
      warehouseId,
      stockLocationId,
      reservedQty: qty,
      status: "ACTIVE",
      note: "Reserved against order allocation",
    });

    await upsertInventoryBalance({
      vendorListingId: String(vendorListingId),
      masterProductId: String(item.masterProductId),
      vendorId: String(item.vendorId),
      shopId: String(item.shopId),
      warehouseId: String(warehouseId),
      stockLocationId: stockLocationId ? String(stockLocationId) : null,
      reservedDelta: qty,
    });

    return allocation;
  });

  res.status(201).json(new ApiResponse("Warehouse allocation created successfully", result));
});

export const releaseOrderReservation = asyncHandler(async (req: Request, res: Response) => {
  const { reservationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reservationId)) {
    throw new ApiError(400, "Invalid reservation id");
  }

  const result = await withTransaction(async () => {
    const reservation = await InventoryReservationModel.findById(reservationId);
    if (!reservation) {
      throw new ApiError(404, "Reservation not found");
    }

    if (reservation.status !== "ACTIVE") {
      throw new ApiError(400, "Reservation is not active");
    }

    await upsertInventoryBalance({
      vendorListingId: String(reservation.vendorListingId),
      masterProductId: "",
      vendorId: String(reservation.vendorId),
      shopId: String(reservation.shopId),
      warehouseId: String(reservation.warehouseId),
      stockLocationId: reservation.stockLocationId ? String(reservation.stockLocationId) : null,
      reservedDelta: -reservation.reservedQty,
    });

    reservation.status = "RELEASED";
    await reservation.save();

    return reservation;
  });

  res.status(200).json(new ApiResponse("Reservation released successfully", result));
});
import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { OrderModel } from "../models/order.model";
import { WarehouseAllocationModel } from "../models/warehouseAllocation.model";
import { PicklistModel } from "../models/picklist.model";
import { PackingModel } from "../models/packing.model";
import { ShipmentModel } from "../models/shipment.model";
import { InventoryReservationModel } from "../models/inventoryReservation.model";
import { StockBatchModel } from "../models/stockBatch.model";
import { allocateFefoBatches } from "../utils/fefo";
import { getNextSequenceNumber, formatSequence } from "../utils/sequence";
import { EventQueueModel } from "../models/eventQueue.model";

export const createPicklist = asyncHandler(async (req: Request, res: Response) => {
  const { orderId, warehouseId, stockLocationId = null, pickerName = "", note = "" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(warehouseId)) {
    throw new ApiError(400, "Invalid ids");
  }

  const allocations = await WarehouseAllocationModel.find({
    orderId,
    warehouseId,
    stockLocationId,
    status: "ALLOCATED",
  });

  if (!allocations.length) {
    throw new ApiError(400, "No allocations found for picklist");
  }

  const seq = await getNextSequenceNumber("GRN");
  const picklistNumber = formatSequence("PKL", seq.financialYear, seq.number);

  const first: any = allocations[0];

  const doc = await PicklistModel.create({
    picklistNumber,
    orderId,
    vendorId: first.vendorId,
    shopId: first.shopId,
    warehouseId,
    stockLocationId,
    items: allocations.map((a: any) => ({
      warehouseAllocationId: a._id,
      vendorListingId: a.vendorListingId,
      batchId: null,
      requestedQty: a.allocatedQty,
      pickedQty: 0,
    })),
    status: "CREATED",
    pickerName,
    note,
  });

  res.status(201).json(new ApiResponse("Picklist created successfully", doc));
});

export const pickWithFefo = asyncHandler(async (req: Request, res: Response) => {
  const { picklistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(picklistId)) {
    throw new ApiError(400, "Invalid picklist id");
  }

  const picklist = await PicklistModel.findById(picklistId);
  if (!picklist) {
    throw new ApiError(404, "Picklist not found");
  }

  for (const line of picklist.items as any[]) {
    const allocations = await allocateFefoBatches({
      vendorListingId: String(line.vendorListingId),
      warehouseId: String(picklist.warehouseId),
      stockLocationId: picklist.stockLocationId ? String(picklist.stockLocationId) : null,
      requiredQty: line.requestedQty,
    });

    if (allocations.length) {
      line.batchId = allocations[0].batchId;
      line.pickedQty = line.requestedQty;

      for (const alloc of allocations) {
        const batch = await StockBatchModel.findById(alloc.batchId);
        if (!batch) continue;

        batch.availableQty = Math.max(0, batch.availableQty - alloc.qty);
        if (batch.availableQty === 0) {
          batch.status = "DEPLETED";
        }
        await batch.save();
      }

      const wa = await WarehouseAllocationModel.findById(line.warehouseAllocationId);
      if (wa) {
        wa.pickedQty = line.requestedQty;
        wa.status = "PICKED";
        await wa.save();
      }
    }
  }

  picklist.status = "PICKED";
  await picklist.save();

  res.status(200).json(new ApiResponse("Picklist picked successfully", picklist));
});

export const createPacking = asyncHandler(async (req: Request, res: Response) => {
  const { picklistId, packageCount = 1, packedBy = "", note = "" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(picklistId)) {
    throw new ApiError(400, "Invalid picklistId");
  }

  const picklist = await PicklistModel.findById(picklistId);
  if (!picklist) {
    throw new ApiError(404, "Picklist not found");
  }

  if (picklist.status !== "PICKED") {
    throw new ApiError(400, "Picklist must be picked before packing");
  }

  const seq = await getNextSequenceNumber("GRN");
  const packingNumber = formatSequence("PKG", seq.financialYear, seq.number);

  const packing = await PackingModel.create({
    packingNumber,
    orderId: picklist.orderId,
    vendorId: picklist.vendorId,
    shopId: picklist.shopId,
    items: picklist.items.map((line: any) => ({
      picklistId: picklist._id,
      vendorListingId: line.vendorListingId,
      packedQty: line.pickedQty,
    })),
    packageCount,
    status: "PACKED",
    packedBy,
    note,
  });

  const allocations = await WarehouseAllocationModel.find({
    orderId: picklist.orderId,
    warehouseId: picklist.warehouseId,
    stockLocationId: picklist.stockLocationId,
  });

  for (const wa of allocations) {
    wa.packedQty = wa.pickedQty;
    wa.status = "PACKED";
    await wa.save();
  }

  res.status(201).json(new ApiResponse("Packing created successfully", packing));
});

export const createShipment = asyncHandler(async (req: Request, res: Response) => {
  const { packingId, courierName = "", awbNumber = "", trackingUrl = "", note = "" } = req.body;

  if (!mongoose.Types.ObjectId.isValid(packingId)) {
    throw new ApiError(400, "Invalid packingId");
  }

  const packing = await PackingModel.findById(packingId);
  if (!packing) {
    throw new ApiError(404, "Packing not found");
  }

  if (packing.status !== "PACKED") {
    throw new ApiError(400, "Packing must be completed before shipment");
  }

  const seq = await getNextSequenceNumber("GRN");
  const shipmentNumber = formatSequence("SHP", seq.financialYear, seq.number);

  const shipment = await ShipmentModel.create({
    shipmentNumber,
    orderId: packing.orderId,
    vendorId: packing.vendorId,
    shopId: packing.shopId,
    packingId: packing._id,
    courierName,
    awbNumber,
    trackingUrl,
    shippedAt: new Date(),
    deliveredAt: null,
    status: "SHIPPED",
    note,
  });

  const allocations = await WarehouseAllocationModel.find({ orderId: packing.orderId });
  for (const wa of allocations) {
    wa.shippedQty = wa.packedQty;
    wa.status = "SHIPPED";
    await wa.save();
  }

  const reservations = await InventoryReservationModel.find({
    orderId: packing.orderId,
    status: "ACTIVE",
  });

  for (const reservation of reservations) {
    reservation.status = "CONSUMED";
    await reservation.save();
  }

  const order = await OrderModel.findById(packing.orderId);
  if (order) {
    order.status = "SHIPPED";
    await order.save();
  }

  await EventQueueModel.create({
    eventType: "SEND_PAYOUT_STATUS",
    payload: {
      orderId: packing.orderId,
      shipmentId: shipment._id,
      awbNumber,
      trackingUrl,
    },
    status: "PENDING",
    attempts: 0,
    maxAttempts: 5,
    lastError: "",
    nextRunAt: null,
  });

  res.status(201).json(new ApiResponse("Shipment created successfully", shipment));
});

export const markShipmentDelivered = asyncHandler(async (req: Request, res: Response) => {
  const { shipmentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
    throw new ApiError(400, "Invalid shipmentId");
  }

  const shipment = await ShipmentModel.findById(shipmentId);
  if (!shipment) {
    throw new ApiError(404, "Shipment not found");
  }

  shipment.status = "DELIVERED";
  shipment.deliveredAt = new Date();
  await shipment.save();

  const order = await OrderModel.findById(shipment.orderId);
  if (order) {
    order.status = "DELIVERED";
    await order.save();
  }

  res.status(200).json(new ApiResponse("Shipment marked delivered", shipment));
});
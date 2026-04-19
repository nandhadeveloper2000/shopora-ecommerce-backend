import mongoose from "mongoose";
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { WarehouseModel } from "../models/warehouse.model";
import { StockLocationModel } from "../models/stockLocation.model";

export const createWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await WarehouseModel.create(req.body);
  res.status(201).json(new ApiResponse("Warehouse created successfully", warehouse));
});

export const getWarehouses = asyncHandler(async (_req: Request, res: Response) => {
  const items = await WarehouseModel.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse("Warehouses fetched successfully", items));
});

export const createStockLocation = asyncHandler(async (req: Request, res: Response) => {
  const { warehouseId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
    throw new ApiError(400, "Invalid warehouse id");
  }

  const item = await StockLocationModel.create(req.body);
  res.status(201).json(new ApiResponse("Stock location created successfully", item));
});

export const getStockLocations = asyncHandler(async (req: Request, res: Response) => {
  const { warehouseId } = req.query;

  const query: Record<string, unknown> = {};
  if (warehouseId && mongoose.Types.ObjectId.isValid(String(warehouseId))) {
    query.warehouseId = new mongoose.Types.ObjectId(String(warehouseId));
  }

  const items = await StockLocationModel.find(query).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse("Stock locations fetched successfully", items));
});
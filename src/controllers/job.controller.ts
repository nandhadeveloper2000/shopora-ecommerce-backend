import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { LowStockAlertModel } from "../models/lowStockAlert.model";
import { SettlementLedgerModel } from "../models/settlementLedger.model";
import { createNotification } from "../utils/notification";

export const runLowStockReminderJob = asyncHandler(async (_req: Request, res: Response) => {
  const items = await LowStockAlertModel.find({ status: "OPEN" });

  for (const item of items) {
    await createNotification({
      vendorId: String(item.vendorId),
      shopId: String(item.shopId),
      audienceType: "VENDOR",
      title: "Low stock reminder",
      message: `Low stock alert is still open. Current quantity: ${item.currentQty}`,
      eventType: "LOW_STOCK",
      meta: { lowStockAlertId: item._id },
    });
  }

  res.status(200).json(
    new ApiResponse("Low stock reminder job completed", {
      remindersCreated: items.length,
    })
  );
});

export const runSettlementReminderJob = asyncHandler(async (_req: Request, res: Response) => {
  const items = await SettlementLedgerModel.find({ settlementStatus: "READY" });

  for (const item of items) {
    await createNotification({
      vendorId: String(item.vendorId),
      shopId: String(item.shopId),
      audienceType: "ADMIN",
      title: "Settlement ready for payout",
      message: `Settlement ${item._id} is ready for payout`,
      eventType: "PAYOUT",
      meta: { settlementId: item._id },
    });
  }

  res.status(200).json(
    new ApiResponse("Settlement reminder job completed", {
      remindersCreated: items.length,
    })
  );
});
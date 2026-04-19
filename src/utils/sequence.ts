import { InvoiceSequenceModel } from "../models/invoiceSequence.model";
import { getIndianFinancialYear } from "./financialYear";

export async function getNextSequenceNumber(sequenceType: "ORDER_INVOICE" | "VENDOR_INVOICE" | "PO" | "GRN") {
  const financialYear = getIndianFinancialYear();

  const seq = await InvoiceSequenceModel.findOneAndUpdate(
    { sequenceType, financialYear },
    { $inc: { currentNumber: 1 } },
    { new: true, upsert: true }
  );

  return {
    financialYear,
    number: seq.currentNumber,
  };
}

export function formatSequence(prefix: string, financialYear: string, number: number) {
  return `${prefix}/${financialYear}/${String(number).padStart(5, "0")}`;
}
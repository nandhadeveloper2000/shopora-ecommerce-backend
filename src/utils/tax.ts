import { TaxClassModel } from "../models/taxClass.model";

export async function calculateItemTax(params: {
  taxClassId?: string | null;
  taxableAmount: number;
  intraState?: boolean;
}) {
  const { taxClassId, taxableAmount, intraState = true } = params;

  if (!taxClassId) {
    return {
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cessRate: 0,
      totalTaxRate: 0,
      taxAmount: 0,
    };
  }

  const taxClass = await TaxClassModel.findById(taxClassId).lean();
  if (!taxClass || !taxClass.isActive) {
    return {
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cessRate: 0,
      totalTaxRate: 0,
      taxAmount: 0,
    };
  }

  const totalTaxRate = intraState
    ? taxClass.cgstRate + taxClass.sgstRate + taxClass.cessRate
    : taxClass.igstRate + taxClass.cessRate;

  const taxAmount = Number(((taxableAmount * totalTaxRate) / 100).toFixed(2));

  return {
    cgstRate: taxClass.cgstRate,
    sgstRate: taxClass.sgstRate,
    igstRate: taxClass.igstRate,
    cessRate: taxClass.cessRate,
    totalTaxRate,
    taxAmount,
  };
}
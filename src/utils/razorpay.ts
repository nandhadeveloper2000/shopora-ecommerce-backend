import crypto from "crypto";

export async function createRazorpayOrder(params: {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const { amount, currency = "INR", receipt, notes = {} } = params;

  return {
    id: `order_${crypto.randomBytes(10).toString("hex")}`,
    entity: "order",
    amount,
    amount_paid: 0,
    amount_due: amount,
    currency,
    receipt,
    status: "created",
    attempts: 0,
    notes,
    created_at: Math.floor(Date.now() / 1000),
  };
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}) {
  const { orderId, paymentId, signature, secret } = params;

  const generated = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generated === signature;
}
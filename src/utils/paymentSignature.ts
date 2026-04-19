import crypto from "crypto";

export function verifyRazorpayPaymentSignature(params: {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  secret: string;
}) {
  const { orderId, razorpayPaymentId, razorpaySignature, secret } = params;

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
}

export function verifyRazorpayWebhookSignature(params: {
  rawBody: Buffer | string;
  signature: string;
  secret: string;
}) {
  const { rawBody, signature, secret } = params;

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return generatedSignature === signature;
}
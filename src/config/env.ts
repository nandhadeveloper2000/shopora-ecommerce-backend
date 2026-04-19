import dotenv from "dotenv";

dotenv.config();

function required(name: string, value?: string) {
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: required("MONGODB_URI", process.env.MONGODB_URI),
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET", process.env.JWT_ACCESS_SECRET),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET),

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "",
  OTP_FROM_EMAIL: process.env.OTP_FROM_EMAIL || "",
  NODEMAILER_EMAIL: process.env.NODEMAILER_EMAIL || "",
  NODEMAILER_PASSWORD: process.env.NODEMAILER_PASSWORD || "",

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  RAZORPAYX_ACCOUNT_NUMBER: process.env.RAZORPAYX_ACCOUNT_NUMBER || "",

  INVOICE_PREFIX: process.env.INVOICE_PREFIX || "INV",
  INVOICE_COMPANY_NAME: process.env.INVOICE_COMPANY_NAME || "",
  INVOICE_COMPANY_GST: process.env.INVOICE_COMPANY_GST || "",
  INVOICE_COMPANY_ADDRESS: process.env.INVOICE_COMPANY_ADDRESS || "",

  RETURN_WINDOW_DAYS: Number(process.env.RETURN_WINDOW_DAYS || 7),
  REFUND_WINDOW_DAYS: Number(process.env.REFUND_WINDOW_DAYS || 7),

  PLATFORM_FEE_PERCENT: Number(process.env.PLATFORM_FEE_PERCENT || 5),
  DEFAULT_GATEWAY_FEE_PERCENT: Number(process.env.DEFAULT_GATEWAY_FEE_PERCENT || 2),

  INVOICE_EMAIL_ENABLED: process.env.INVOICE_EMAIL_ENABLED === "true",
  INVOICE_EMAIL_SUBJECT_PREFIX: process.env.INVOICE_EMAIL_SUBJECT_PREFIX || "Invoice",

  NODE_ENV: process.env.NODE_ENV || "development",
  REFRESH_PEPPER: process.env.REFRESH_PEPPER || "rpepper",
  OTP_PEPPER: process.env.OTP_PEPPER || "pepper",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
  ENABLE_LOGIN_OTP: process.env.ENABLE_LOGIN_OTP === "true",
};
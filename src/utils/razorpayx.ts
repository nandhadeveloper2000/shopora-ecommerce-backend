import axios from "axios";
import crypto from "crypto";
import { env } from "../config/env";

const razorpayxClient = axios.create({
  baseURL: "https://api.razorpay.com/v1",
  auth: {
    username: env.RAZORPAY_KEY_ID,
    password: env.RAZORPAY_KEY_SECRET,
  },
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export async function createRazorpayXContact(params: {
  name: string;
  email?: string;
  contact?: string;
  reference_id?: string;
  type?: "vendor";
}) {
  const response = await razorpayxClient.post("/contacts", {
    name: params.name,
    email: params.email || "",
    contact: params.contact || "",
    reference_id: params.reference_id || "",
    type: params.type || "vendor",
  });

  return response.data;
}

export async function createRazorpayXFundAccount(params: {
  contact_id: string;
  name: string;
  ifsc: string;
  account_number: string;
}) {
  const response = await razorpayxClient.post("/fund_accounts", {
    contact_id: params.contact_id,
    account_type: "bank_account",
    bank_account: {
      name: params.name,
      ifsc: params.ifsc,
      account_number: params.account_number,
    },
  });

  return response.data;
}

export async function createRazorpayXPayout(params: {
  fund_account_id: string;
  amountSubunits: number;
  reference_id: string;
  narration: string;
  mode?: "IMPS" | "NEFT" | "RTGS";
  purpose?: string;
}) {
  const idempotencyKey = crypto.randomUUID();

  const response = await razorpayxClient.post(
    "/payouts",
    {
      account_number: env.RAZORPAYX_ACCOUNT_NUMBER,
      fund_account_id: params.fund_account_id,
      amount: params.amountSubunits,
      currency: "INR",
      mode: params.mode || "IMPS",
      purpose: params.purpose || "payout",
      queue_if_low_balance: true,
      reference_id: params.reference_id,
      narration: params.narration,
    },
    {
      headers: {
        "X-Payout-Idempotency": idempotencyKey,
      },
    }
  );

  return {
    idempotencyKey,
    data: response.data,
  };
}
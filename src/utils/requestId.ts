import crypto from "crypto";

export function generateRequestId() {
  return crypto.randomUUID();
}
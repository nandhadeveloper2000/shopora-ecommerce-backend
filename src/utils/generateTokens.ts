import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function generateAccessToken(payload: object) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "1d" });
}

export function generateRefreshToken(payload: object) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}
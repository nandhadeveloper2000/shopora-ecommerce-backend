import request from "supertest";
import { hashValue } from "../../src/utils/hash";
import { UserModel } from "../../src/models/user.model";
import { generateAccessToken, generateRefreshToken } from "../../src/utils/generateTokens";

export async function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: string;
  mobile?: string;
}) {
  const hashedPassword = await hashValue(params.password);

  return UserModel.create({
    name: params.name,
    email: params.email,
    password: hashedPassword,
    role: params.role,
    mobile: params.mobile || "",
    isActive: true,
    verifyEmail: true,
    isDeleted: false,
  });
}

export function buildAuthTokens(user: { _id: unknown; email: string; role: string }) {
  const payload = {
    id: String(user._id),
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function loginWithApi(app: any, email: string, password: string) {
  return request(app).post("/api/auth/login").send({ email, password });
}
import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { compareValue, hashValue } from "../utils/hash";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens";
import { AuthRequest } from "../middlewares/auth.middleware";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, mobile } = req.body;

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await hashValue(password);

  const user = await UserModel.create({
    name,
    email,
    password: hashedPassword,
    role,
    mobile,
  });

  res.status(201).json(new ApiResponse("User registered successfully", user));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await compareValue(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid credentials");
  }

  const payload = {
    id: String(user._id),
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  res.status(200).json(
    new ApiResponse("Login successful", {
      user,
      accessToken,
      refreshToken,
    })
  );
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await UserModel.findById(userId).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json(new ApiResponse("User profile fetched successfully", user));
});
import { Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../middlewares/auth.middleware";
import { AddressModel } from "../models/address.model";

export const createAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const {
    fullName,
    mobile,
    alternateMobile,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    country,
    postalCode,
    addressType,
    isDefault,
  } = req.body;

  if (!fullName || !mobile || !addressLine1 || !city || !state || !postalCode) {
    throw new ApiError(400, "Required address fields are missing");
  }

  if (isDefault === true) {
    await AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
  }

  const address = await AddressModel.create({
    userId,
    fullName,
    mobile,
    alternateMobile: alternateMobile || "",
    addressLine1,
    addressLine2: addressLine2 || "",
    landmark: landmark || "",
    city,
    state,
    country: country || "India",
    postalCode,
    addressType: addressType || "HOME",
    isDefault: Boolean(isDefault),
  });

  res.status(201).json(new ApiResponse("Address created successfully", address));
});

export const getMyAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const addresses = await AddressModel.find({ userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  res.status(200).json(new ApiResponse("Addresses fetched successfully", addresses));
});

export const getSingleAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid address id");
  }

  const address = await AddressModel.findOne({ _id: id, userId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  res.status(200).json(new ApiResponse("Address fetched successfully", address));
});

export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid address id");
  }

  const address = await AddressModel.findOne({ _id: id, userId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  const {
    fullName,
    mobile,
    alternateMobile,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    country,
    postalCode,
    addressType,
    isDefault,
  } = req.body;

  if (typeof isDefault === "boolean" && isDefault) {
    await AddressModel.updateMany(
      { userId, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );
    address.isDefault = true;
  } else if (typeof isDefault === "boolean") {
    address.isDefault = false;
  }

  if (fullName !== undefined) address.fullName = fullName;
  if (mobile !== undefined) address.mobile = mobile;
  if (alternateMobile !== undefined) address.alternateMobile = alternateMobile;
  if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
  if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
  if (landmark !== undefined) address.landmark = landmark;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (country !== undefined) address.country = country;
  if (postalCode !== undefined) address.postalCode = postalCode;
  if (addressType !== undefined) address.addressType = addressType;

  await address.save();

  res.status(200).json(new ApiResponse("Address updated successfully", address));
});

export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid address id");
  }

  const address = await AddressModel.findOne({ _id: id, userId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  const wasDefault = address.isDefault;
  await address.deleteOne();

  if (wasDefault) {
    const nextAddress = await AddressModel.findOne({ userId }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.status(200).json(new ApiResponse("Address deleted successfully"));
});

export const setDefaultAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid address id");
  }

  const address = await AddressModel.findOne({ _id: id, userId });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  await AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();

  res.status(200).json(new ApiResponse("Default address updated successfully", address));
});
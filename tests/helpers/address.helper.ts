import { AddressModel } from "../../src/models/address.model";

export async function createAddressFixture(userId: string) {
  return AddressModel.create({
    userId,
    fullName: "Test Customer",
    mobile: "9876543210",
    alternateMobile: "",
    addressLine1: "12 Test Street",
    addressLine2: "Near Junction",
    landmark: "Test Landmark",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    postalCode: "600001",
    addressType: "HOME",
    isDefault: true,
  });
}
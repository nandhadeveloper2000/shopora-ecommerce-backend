import { ROLES } from "../../src/constants/roles";
import { createUser } from "./auth.helper";
import { MasterCategoryModel } from "../../src/models/masterCategory.model";
import { CategoryModel } from "../../src/models/category.model";
import { BrandModel } from "../../src/models/brand.model";
import { ShopModel } from "../../src/models/shop.model";
import { MasterProductModel } from "../../src/models/masterProduct.model";
import { VendorListingModel } from "../../src/models/vendorListing.model";

export async function createAdminFixture() {
  return createUser({
    name: "Admin User",
    email: "admin@test.com",
    password: "Admin@123",
    role: ROLES.ADMIN,
  });
}

export async function createVendorFixture() {
  const vendor = await createUser({
    name: "Vendor User",
    email: "vendor@test.com",
    password: "Vendor@123",
    role: ROLES.VENDOR,
  });

  const shop = await ShopModel.create({
    name: "Vendor Shop",
    slug: "vendor-shop",
    ownerId: vendor._id,
    logo: "",
    logoPublicId: "",
    isActive: true,
    isDeleted: false,
  });

  return { vendor, shop };
}

export async function createCustomerFixture() {
  return createUser({
    name: "Customer User",
    email: "customer@test.com",
    password: "Customer@123",
    role: ROLES.CUSTOMER,
  });
}

export async function createCatalogFixture() {
  const masterCategory = await MasterCategoryModel.create({
    name: "Electronics",
    slug: "electronics",
    isActive: true,
  });

  const category = await CategoryModel.create({
    name: "Mobiles",
    slug: "mobiles",
    masterCategoryId: masterCategory._id,
    isActive: true,
  });

  const brand = await BrandModel.create({
    name: "Samsung",
    slug: "samsung",
    isActive: true,
  });

  return { masterCategory, category, brand };
}

export async function createMasterProductFixture(params: {
  masterCategoryId: string;
  categoryId: string;
  brandId: string;
}) {
  return MasterProductModel.create({
    title: "Samsung Galaxy S24",
    slug: "samsung-galaxy-s24",
    shortDescription: "Flagship phone",
    description: "Top tier mobile phone",
    masterCategoryId: params.masterCategoryId,
    categoryId: params.categoryId,
    brandId: params.brandId,
    skuCode: "S24-TEST-001",
    images: [],
    specs: [],
    tags: ["samsung", "mobile"],
    isActive: true,
  });
}

export async function createVendorListingFixture(params: {
  vendorId: string;
  shopId: string;
  masterProductId: string;
}) {
  return VendorListingModel.create({
    shopId: params.shopId,
    vendorId: params.vendorId,
    masterProductId: params.masterProductId,
    sellingPrice: 50000,
    mrp: 55000,
    stock: 10,
    minOrderQty: 1,
    images: [],
    offerText: "Test offer",
    shippingCharge: 100,
    estimatedDeliveryDays: 3,
    isActive: true,
    isApproved: true,
  });
}
import { createAdminFixture, createCatalogFixture, createCustomerFixture, createMasterProductFixture, createVendorFixture, createVendorListingFixture } from "./factory.helper";

export async function seedOrderLifecycleData() {
  const admin = await createAdminFixture();
  const { vendor, shop } = await createVendorFixture();
  const customer = await createCustomerFixture();
  const { masterCategory, category, brand } = await createCatalogFixture();

  const product = await createMasterProductFixture({
    masterCategoryId: String(masterCategory._id),
    categoryId: String(category._id),
    brandId: String(brand._id),
  });

  const listing = await createVendorListingFixture({
    vendorId: String(vendor._id),
    shopId: String(shop._id),
    masterProductId: String(product._id),
  });

  return {
    admin,
    vendor,
    shop,
    customer,
    masterCategory,
    category,
    brand,
    product,
    listing,
  };
}
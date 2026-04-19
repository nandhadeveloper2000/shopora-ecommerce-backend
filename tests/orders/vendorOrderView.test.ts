import { connectTestDB, clearTestDB, disconnectTestDB } from "../setup/testDb";
import { getAppClient } from "../helpers/appContext.helper";
import { seedOrderLifecycleData } from "../helpers/seed.helper";
import { buildAuthTokens } from "../helpers/auth.helper";
import { createAddressFixture } from "../helpers/address.helper";

describe("Vendor Order View API", () => {
  const { request } = getAppClient();

  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it("vendor should view vendor orders", async () => {
    const { customer, vendor, listing } = await seedOrderLifecycleData();
    const customerTokens = buildAuthTokens(customer);
    const vendorTokens = buildAuthTokens(vendor);

    const address = await createAddressFixture(String(customer._id));

    await request
      .post("/api/cart")
      .set("Authorization", `Bearer ${customerTokens.accessToken}`)
      .send({
        vendorListingId: String(listing._id),
        quantity: 1,
      });

    await request
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerTokens.accessToken}`)
      .send({
        addressId: String(address._id),
        paymentMethod: "COD",
      });

    const response = await request
      .get("/api/orders/vendor")
      .set("Authorization", `Bearer ${vendorTokens.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
});
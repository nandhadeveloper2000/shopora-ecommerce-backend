import { connectTestDB, clearTestDB, disconnectTestDB } from "../setup/testDb";
import { getAppClient } from "../helpers/appContext.helper";
import { seedOrderLifecycleData } from "../helpers/seed.helper";
import { buildAuthTokens } from "../helpers/auth.helper";

describe("Cart API", () => {
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

  it("should add item to cart", async () => {
    const { customer, listing } = await seedOrderLifecycleData();
    const { accessToken } = buildAuthTokens(customer);

    const response = await request
      .post("/api/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        vendorListingId: String(listing._id),
        quantity: 2,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items.length).toBe(1);
    expect(response.body.data.summary.totalItems).toBe(2);
  });

  it("should fetch my cart", async () => {
    const { customer, listing } = await seedOrderLifecycleData();
    const { accessToken } = buildAuthTokens(customer);

    await request
      .post("/api/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        vendorListingId: String(listing._id),
        quantity: 1,
      });

    const response = await request
      .get("/api/cart")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items.length).toBe(1);
  });
});
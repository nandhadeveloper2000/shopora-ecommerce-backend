import { connectTestDB, clearTestDB, disconnectTestDB } from "../setup/testDb";
import { getAppClient } from "../helpers/appContext.helper";
import { seedOrderLifecycleData } from "../helpers/seed.helper";

describe("Customer Product API", () => {
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

  it("should fetch customer products", async () => {
    await seedOrderLifecycleData();

    const response = await request.get("/api/products");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(response.body.data.items.length).toBeGreaterThan(0);
  });
});
import { connectTestDB, clearTestDB, disconnectTestDB } from "../setup/testDb";
import { getAppClient } from "../helpers/appContext.helper";
import { ROLES } from "../../src/constants/roles";

describe("Auth API", () => {
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

  it("should register a user", async () => {
    const response = await request.post("/api/auth/register").send({
      name: "Test User",
      email: "testuser@test.com",
      password: "Password@123",
      role: ROLES.CUSTOMER,
      mobile: "9999999999",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("testuser@test.com");
  });

  it("should login a user", async () => {
    await request.post("/api/auth/register").send({
      name: "Login User",
      email: "login@test.com",
      password: "Password@123",
      role: ROLES.CUSTOMER,
    });

    const response = await request.post("/api/auth/login").send({
      email: "login@test.com",
      password: "Password@123",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
  });
});
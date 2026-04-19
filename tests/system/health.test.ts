import { getAppClient } from "../helpers/appContext.helper";

describe("System bootstrap", () => {
  const { request } = getAppClient();

  it("should respond on test health route", async () => {
    const response = await request.get("/health-test");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
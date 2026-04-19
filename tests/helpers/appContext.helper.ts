import request from "supertest";
import { createTestApp } from "../setup/testApp";

export function getAppClient() {
  const app = createTestApp();
  return {
    app,
    request: request(app),
  };
}   
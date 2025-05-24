import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CreateExpressServer, getExpressServer } from "./server";
import { Express } from "express";
import { CheckNoTestData } from "src/scripts/tools";

describe("CreateExpressServer", () => {
  let server: Express;
  let port: number;

  beforeAll(() => {
    const app = CreateExpressServer();
    server = app.listen(0); // Use an ephemeral port
    port = (server.address() as any).port;
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  const makeRequest = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`http://localhost:${port}${path}`, options);
    const data = await response.text();
    return { status: response.status, data };
  };

  it("should initialize the server and respond to requests", async () => {
    const response = await makeRequest("/");
    expect(response.status).toBe(200);
    expect(JSON.parse(response.data)).toEqual({ all: "good" });
  });

  describe("/deleteTestData endpoint", () => {
    it("should return 403 if TESTING environment variable is not 'test'", async () => {
      process.env.TESTING = "false";
      const response = await makeRequest("/deleteTestData");
      expect(response.status).toBe(403);
    });

    it("should delete test data and return success if TESTING is 'true'", async () => {
      process.env.TESTING = "true";
      const response = await makeRequest("/deleteTestData");
      expect(response.status).toBe(200);

      // ensure no test data remains
      expect(await CheckNoTestData()).toBe(true);
    });
  });

  describe("/verifyJWT endpoint", () => {
    it("should require authentication", async () => {
      const response = await makeRequest("/verifyJWT", { method: "POST" });
      expect(response.status).toBe(401); // Unauthorized
    });

    // Additional tests for valid JWT can be added here if a mock JWT is available
  });
});
import request from "supertest";
import app from "../src/server";

describe("System endpoints", () => {
  it("deve responder health", async () => {
    const res = await request(app).get("/api/system/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });

  it("deve responder readiness", async () => {
    const res = await request(app).get("/api/system/readiness");
    expect([200, 503]).toContain(res.status);
  });
});

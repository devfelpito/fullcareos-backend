import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/server";

describe("Auth rate limit /api/auth/login", () => {
  it("deve responder erro de credencial inválida sem quebrar (ambiente de teste)", async () => {
    const payload = { email: "naoexiste@teste.com", password: "senhaerrada" };

    for (let i = 0; i < 5; i++) {
      const res = await request(app).post("/api/auth/login").send(payload);
      expect([401, 404, 429]).toContain(res.status);
    }
  });
});
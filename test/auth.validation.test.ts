import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("Auth validation /api/auth/login", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("deve retornar 400 para payload invalido", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "email-invalido", password: "" });

    expect(res.status).toBe(400);
  });
});

import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("Auth /api/auth/login", () => {
  const email = "admin@fullcareos.com";
  const password = "Fullcare123";

  beforeAll(async () => {
    // assume que seed já foi rodado no banco de dev/teste
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error(
        "Usuário admin não encontrado. Rode: npm run seed antes dos testes."
      );
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("deve logar com credenciais válidas e não retornar password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toBeTruthy();

    // regra crítica
    expect(res.body.user.password).toBeUndefined();
  });

  it("deve falhar com senha inválida", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "senhaErrada" });

    expect(res.status).toBe(401);
  });
});
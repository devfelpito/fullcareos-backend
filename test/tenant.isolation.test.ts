import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("Tenant isolation", () => {
  const passwordPlain = "123456";
  let tokenA = "";
  let tokenB = "";
  let companyAId = "";
  let companyBId = "";
  let roleAId = "";
  let roleBId = "";

  beforeAll(async () => {
    // limpa dados de teste antigos (por nome/email específicos)
    await prisma.user.deleteMany({
      where: {
        email: { in: ["tenant-a@teste.com", "tenant-b@teste.com"] },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["Role Tenant A", "Role Tenant B"] },
      },
    });

    await prisma.client.deleteMany({
      where: {
        OR: [{ name: "Cliente Tenant A" }, { name: "Cliente Tenant B" }],
      },
    });

    await prisma.company.deleteMany({
      where: {
        OR: [{ email: "empresa-a@teste.com" }, { email: "empresa-b@teste.com" }],
      },
    });

    // cria empresas
    const companyA = await prisma.company.create({
      data: {
        name: "Empresa A",
        email: "empresa-a@teste.com",
        phone: "11999990001",
        address: "Rua A, 100",
        plan: "trial",
      },
    });

    const companyB = await prisma.company.create({
      data: {
        name: "Empresa B",
        email: "empresa-b@teste.com",
        phone: "11999990002",
        address: "Rua B, 200",
        plan: "trial",
      },
    });

    companyAId = companyA.id;
    companyBId = companyB.id;

    // cria roles
    const roleA = await prisma.role.create({
      data: {
        name: "Role Tenant A",
        companyId: companyAId,
      },
    });

    const roleB = await prisma.role.create({
      data: {
        name: "Role Tenant B",
        companyId: companyBId,
      },
    });

    roleAId = roleA.id;
    roleBId = roleB.id;

    const hash = await bcrypt.hash(passwordPlain, 10);

    // cria usuários
    const userA = await prisma.user.create({
      data: {
        name: "User A",
        email: "tenant-a@teste.com",
        password: hash,
        active: true,
        companyId: companyAId,
        roleId: roleAId,
      },
    });

    const userB = await prisma.user.create({
      data: {
        name: "User B",
        email: "tenant-b@teste.com",
        password: hash,
        active: true,
        companyId: companyBId,
        roleId: roleBId,
      },
    });

    // gera tokens
    tokenA = jwt.sign(
      { userId: userA.id, companyId: companyAId, roleId: roleAId },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    tokenB = jwt.sign(
      { userId: userB.id, companyId: companyBId, roleId: roleBId },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    // cleanup final
    await prisma.user.deleteMany({
      where: {
        email: { in: ["tenant-a@teste.com", "tenant-b@teste.com"] },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["Role Tenant A", "Role Tenant B"] },
      },
    });

    await prisma.client.deleteMany({
      where: {
        OR: [{ name: "Cliente Tenant A" }, { name: "Cliente Tenant B" }],
      },
    });

    await prisma.company.deleteMany({
      where: {
        OR: [{ email: "empresa-a@teste.com" }, { email: "empresa-b@teste.com" }],
      },
    });

    await prisma.$disconnect();
  });

  it("tenant A cria cliente e tenant B não deve enxergar", async () => {
    // tenant A cria cliente
    const createRes = await request(app)
      .post("/api/client")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        name: "Cliente Tenant A",
        email: "cliente-a@teste.com",
        phone: "11900000001",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe("Cliente Tenant A");
    expect(createRes.body.companyId).toBe(companyAId);

    // tenant A lista e deve ver
    const listA = await request(app)
      .get("/api/client")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(listA.status).toBe(200);
    const aSeesClient = listA.body.some((c: any) => c.name === "Cliente Tenant A");
    expect(aSeesClient).toBe(true);

    // tenant B lista e NÃO deve ver cliente da A
    const listB = await request(app)
      .get("/api/client")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(listB.status).toBe(200);
    const bSeesClient = listB.body.some((c: any) => c.name === "Cliente Tenant A");
    expect(bSeesClient).toBe(false);
  });
});
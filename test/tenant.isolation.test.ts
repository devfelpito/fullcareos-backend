import request from "supertest";
import bcrypt from "bcrypt";
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
  let clientsReadPermissionId = "";

  beforeAll(async () => {
    // Cleanup na ordem correta para evitar FK errors
    await prisma.user.deleteMany({
      where: {
        email: { in: ["tenant-a@teste.com", "tenant-b@teste.com"] },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        role: {
          name: { in: ["Role Tenant A", "Role Tenant B"] },
        },
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

    // Garante permissão clients:read
    const clientsReadPermission = await prisma.permission.upsert({
      where: { name: "clients:read" },
      update: {},
      create: { name: "clients:read" },
    });

    clientsReadPermissionId = clientsReadPermission.id;

    // Vincula clients:read às duas roles usadas no teste
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleAId,
          permissionId: clientsReadPermissionId,
        },
      },
      update: {},
      create: {
        roleId: roleAId,
        permissionId: clientsReadPermissionId,
      },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleBId,
          permissionId: clientsReadPermissionId,
        },
      },
      update: {},
      create: {
        roleId: roleBId,
        permissionId: clientsReadPermissionId,
      },
    });

    const hash = await bcrypt.hash(passwordPlain, 10);

    // cria usuários
    await prisma.user.create({
      data: {
        name: "User A",
        email: "tenant-a@teste.com",
        password: hash,
        active: true,
        companyId: companyAId,
        roleId: roleAId,
      },
    });

    await prisma.user.create({
      data: {
        name: "User B",
        email: "tenant-b@teste.com",
        password: hash,
        active: true,
        companyId: companyBId,
        roleId: roleBId,
      },
    });

    // gera tokens via login real
    const loginA = await request(app)
      .post("/api/auth/login")
      .send({ email: "tenant-a@teste.com", password: passwordPlain });

    const loginB = await request(app)
      .post("/api/auth/login")
      .send({ email: "tenant-b@teste.com", password: passwordPlain });

    expect(loginA.status).toBe(200);
    expect(loginB.status).toBe(200);

    tokenA = loginA.body.token;
    tokenB = loginB.body.token;
  });

  afterAll(async () => {
    // cleanup final na ordem correta
    await prisma.user.deleteMany({
      where: {
        email: { in: ["tenant-a@teste.com", "tenant-b@teste.com"] },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: { in: [roleAId, roleBId] },
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
    // cria cliente direto no banco para empresa A
    const created = await prisma.client.create({
      data: {
        name: "Cliente Tenant A",
        email: "cliente-a@teste.com",
        phone: "11900000001",
        companyId: companyAId,
      },
    });

    expect(created.name).toBe("Cliente Tenant A");
    expect(created.companyId).toBe(companyAId);

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
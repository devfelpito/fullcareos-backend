import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - clients:write", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let allowedToken = "";
  let deniedToken = "";

  beforeAll(async () => {
    // cleanup idempotente
    await prisma.user.deleteMany({
      where: {
        email: { in: ["rbac-write-allow@teste.com", "rbac-write-deny@teste.com"] },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        role: {
          name: { in: ["RBAC Write Allowed Role", "RBAC Write Denied Role"] },
        },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["RBAC Write Allowed Role", "RBAC Write Denied Role"] },
      },
    });

    await prisma.client.deleteMany({
      where: {
        OR: [{ email: "rbac-write-client@teste.com" }, { name: "RBAC Write Client" }],
      },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-write-company@teste.com" },
    });

    // cria empresa
    const company = await prisma.company.create({
      data: {
        name: "RBAC Write Company",
        email: "rbac-write-company@teste.com",
        phone: "11999990111",
        address: "Rua RBAC Write, 200",
        plan: "trial",
      },
    });

    companyId = company.id;

    // cria roles
    const roleAllowed = await prisma.role.create({
      data: {
        name: "RBAC Write Allowed Role",
        companyId,
      },
    });

    const roleDenied = await prisma.role.create({
      data: {
        name: "RBAC Write Denied Role",
        companyId,
      },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    // garante permissão clients:write
    const permClientsWrite = await prisma.permission.upsert({
      where: { name: "clients:write" },
      update: {},
      create: { name: "clients:write" },
    });

    // vincula write somente à roleAllowed
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleAllowedId,
          permissionId: permClientsWrite.id,
        },
      },
      update: {},
      create: {
        roleId: roleAllowedId,
        permissionId: permClientsWrite.id,
      },
    });

    // usuários
    const hash = await bcrypt.hash("123456", 10);

    await prisma.user.create({
      data: {
        name: "RBAC Write Allowed User",
        email: "rbac-write-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    await prisma.user.create({
      data: {
        name: "RBAC Write Denied User",
        email: "rbac-write-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    // tokens via login real
    const loginAllowed = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-write-allow@teste.com", password: "123456" });

    const loginDenied = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-write-deny@teste.com", password: "123456" });

    expect(loginAllowed.status).toBe(200);
    expect(loginDenied.status).toBe(200);

    allowedToken = loginAllowed.body.token;
    deniedToken = loginDenied.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ["rbac-write-allow@teste.com", "rbac-write-deny@teste.com"] },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: { in: [roleAllowedId, roleDeniedId] },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["RBAC Write Allowed Role", "RBAC Write Denied Role"] },
      },
    });

    await prisma.client.deleteMany({
      where: {
        OR: [{ email: "rbac-write-client@teste.com" }, { name: "RBAC Write Client" }],
      },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-write-company@teste.com" },
    });

    await prisma.$disconnect();
  });

  it("deve permitir POST /api/client para quem tem clients:write", async () => {
    const res = await request(app)
      .post("/api/client")
      .set("Authorization", `Bearer ${allowedToken}`)
      .send({
        name: "RBAC Write Client",
        email: "rbac-write-client@teste.com",
        phone: "11900001111",
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("RBAC Write Client");
    expect(res.body.companyId).toBe(companyId);
  });

  it("deve negar POST /api/client para quem NÃO tem clients:write", async () => {
    const res = await request(app)
      .post("/api/client")
      .set("Authorization", `Bearer ${deniedToken}`)
      .send({
        name: "RBAC Write Client Denied",
        email: "rbac-write-client-denied@teste.com",
        phone: "11900002222",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Acesso negado");
  });
});
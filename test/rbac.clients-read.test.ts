import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - clients:read", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let allowedToken = "";
  let deniedToken = "";

  beforeAll(async () => {
    // cleanup idempotente de dados de teste (ordem para evitar FK)
    await prisma.user.deleteMany({
      where: {
        email: { in: ["rbac-allow@teste.com", "rbac-deny@teste.com"] },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        role: {
          name: { in: ["RBAC Allowed Role", "RBAC Denied Role"] },
        },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["RBAC Allowed Role", "RBAC Denied Role"] },
      },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-company@teste.com" },
    });

    // cria empresa
    const company = await prisma.company.create({
      data: {
        name: "RBAC Company",
        email: "rbac-company@teste.com",
        phone: "11999990099",
        address: "Rua RBAC, 100",
        plan: "trial",
      },
    });

    companyId = company.id;

    // cria roles
    const roleAllowed = await prisma.role.create({
      data: {
        name: "RBAC Allowed Role",
        companyId,
      },
    });

    const roleDenied = await prisma.role.create({
      data: {
        name: "RBAC Denied Role",
        companyId,
      },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    // garante permissão clients:read sem deletar permissão global
    const permClientsRead = await prisma.permission.upsert({
      where: { name: "clients:read" },
      update: {},
      create: { name: "clients:read" },
    });

    // vincula permissão somente à roleAllowed
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleAllowedId,
          permissionId: permClientsRead.id,
        },
      },
      update: {},
      create: {
        roleId: roleAllowedId,
        permissionId: permClientsRead.id,
      },
    });

    // cria usuários
    const hash = await bcrypt.hash("123456", 10);

    await prisma.user.create({
      data: {
        name: "RBAC Allowed User",
        email: "rbac-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    await prisma.user.create({
      data: {
        name: "RBAC Denied User",
        email: "rbac-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    // gera tokens via login real
    const loginAllowed = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-allow@teste.com", password: "123456" });

    const loginDenied = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-deny@teste.com", password: "123456" });

    // logs de diagnóstico (temporários)
    console.log("LOGIN ALLOWED STATUS:", loginAllowed.status);
    console.log("LOGIN ALLOWED BODY:", loginAllowed.body);
    console.log("LOGIN DENIED STATUS:", loginDenied.status);
    console.log("LOGIN DENIED BODY:", loginDenied.body);

    expect(loginAllowed.status).toBe(200);
    expect(loginDenied.status).toBe(200);

    expect(loginAllowed.body?.token).toBeTruthy();
    expect(loginDenied.body?.token).toBeTruthy();

    allowedToken = loginAllowed.body.token;
    deniedToken = loginDenied.body.token;

    // log de diagnóstico (temporário)
    console.log("ALLOWED TOKEN PREFIX:", String(allowedToken).slice(0, 20));
    console.log("DENIED TOKEN PREFIX:", String(deniedToken).slice(0, 20));
  });

  afterAll(async () => {
    // cleanup final
    await prisma.user.deleteMany({
      where: {
        email: { in: ["rbac-allow@teste.com", "rbac-deny@teste.com"] },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: { in: [roleAllowedId, roleDeniedId] },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["RBAC Allowed Role", "RBAC Denied Role"] },
      },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-company@teste.com" },
    });

    await prisma.$disconnect();
  });

  it("deve permitir acesso ao GET /api/client para quem tem clients:read", async () => {
    const res = await request(app)
      .get("/api/client")
      .set("Authorization", `Bearer ${allowedToken}`);

    console.log("GET /api/client allowed ->", res.status, res.body);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("deve negar acesso ao GET /api/client para quem NÃO tem clients:read", async () => {
    const res = await request(app)
      .get("/api/client")
      .set("Authorization", `Bearer ${deniedToken}`);

    console.log("GET /api/client denied ->", res.status, res.body);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Acesso negado");
  });
});
import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - services:read", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let allowedToken = "";
  let deniedToken = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-services-read-allow@teste.com", "rbac-services-read-deny@teste.com"] } },
    });

    await prisma.rolePermission.deleteMany({
      where: { role: { name: { in: ["RBAC Services Read Allowed Role", "RBAC Services Read Denied Role"] } } },
    });

    await prisma.role.deleteMany({
      where: { name: { in: ["RBAC Services Read Allowed Role", "RBAC Services Read Denied Role"] } },
    });

    await prisma.service.deleteMany({
      where: { name: "RBAC Services Read Seed Service" },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-services-read-company@teste.com" },
    });

    const company = await prisma.company.create({
      data: {
        name: "RBAC Services Read Company",
        email: "rbac-services-read-company@teste.com",
        phone: "11999991001",
        address: "Rua Services Read",
        plan: "trial",
      },
    });
    companyId = company.id;

    const roleAllowed = await prisma.role.create({
      data: { name: "RBAC Services Read Allowed Role", companyId },
    });

    const roleDenied = await prisma.role.create({
      data: { name: "RBAC Services Read Denied Role", companyId },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const perm = await prisma.permission.upsert({
      where: { name: "services:read" },
      update: {},
      create: { name: "services:read" },
    });

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAllowedId, permissionId: perm.id } },
      update: {},
      create: { roleId: roleAllowedId, permissionId: perm.id },
    });

    await prisma.service.create({
      data: {
        name: "RBAC Services Read Seed Service",
        price: 100,
        duration: 30,
        companyId,
      },
    });

    const hash = await bcrypt.hash("123456", 10);

    await prisma.user.create({
      data: {
        name: "Allowed",
        email: "rbac-services-read-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    await prisma.user.create({
      data: {
        name: "Denied",
        email: "rbac-services-read-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    const loginAllowed = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-services-read-allow@teste.com", password: "123456" });

    const loginDenied = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-services-read-deny@teste.com", password: "123456" });

    expect(loginAllowed.status).toBe(200);
    expect(loginDenied.status).toBe(200);

    allowedToken = loginAllowed.body.token;
    deniedToken = loginDenied.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-services-read-allow@teste.com", "rbac-services-read-deny@teste.com"] } },
    });
    await prisma.rolePermission.deleteMany({
      where: { roleId: { in: [roleAllowedId, roleDeniedId] } },
    });
    await prisma.role.deleteMany({
      where: { id: { in: [roleAllowedId, roleDeniedId] } },
    });
    await prisma.service.deleteMany({
      where: { companyId },
    });
    await prisma.company.deleteMany({
      where: { id: companyId || undefined },
    });
    await prisma.$disconnect();
  });

  it("permite GET /api/services para quem tem services:read", async () => {
    const res = await request(app).get("/api/services").set("Authorization", `Bearer ${allowedToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("nega GET /api/services para quem NÃO tem services:read", async () => {
    const res = await request(app).get("/api/services").set("Authorization", `Bearer ${deniedToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Acesso negado");
  });
});
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - services:write", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let allowedToken = "";
  let deniedToken = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["rbac-services-write-allow@teste.com", "rbac-services-write-deny@teste.com"],
        },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        role: {
          name: { in: ["RBAC Services Write Allowed Role", "RBAC Services Write Denied Role"] },
        },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["RBAC Services Write Allowed Role", "RBAC Services Write Denied Role"] },
      },
    });

    await prisma.service.deleteMany({
      where: {
        OR: [{ name: "RBAC Service Write Allowed" }, { name: "RBAC Service Write Denied" }],
      },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-services-write-company@teste.com" },
    });

    const company = await prisma.company.create({
      data: {
        name: "RBAC Services Write Company",
        email: "rbac-services-write-company@teste.com",
        phone: "11999990333",
        address: "Rua RBAC Services, 300",
        plan: "trial",
      },
    });

    companyId = company.id;

    const roleAllowed = await prisma.role.create({
      data: {
        name: "RBAC Services Write Allowed Role",
        companyId,
      },
    });

    const roleDenied = await prisma.role.create({
      data: {
        name: "RBAC Services Write Denied Role",
        companyId,
      },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const permServicesWrite = await prisma.permission.upsert({
      where: { name: "services:write" },
      update: {},
      create: { name: "services:write" },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleAllowedId,
          permissionId: permServicesWrite.id,
        },
      },
      update: {},
      create: {
        roleId: roleAllowedId,
        permissionId: permServicesWrite.id,
      },
    });

    const hash = await bcrypt.hash("123456", 10);

    const userAllowed = await prisma.user.create({
      data: {
        name: "RBAC Services Write Allowed User",
        email: "rbac-services-write-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    const userDenied = await prisma.user.create({
      data: {
        name: "RBAC Services Write Denied User",
        email: "rbac-services-write-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    allowedToken = jwt.sign(
      { userId: userAllowed.id, companyId, roleId: roleAllowedId },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    deniedToken = jwt.sign(
      { userId: userDenied.id, companyId, roleId: roleDeniedId },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["rbac-services-write-allow@teste.com", "rbac-services-write-deny@teste.com"],
        },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: { in: [roleAllowedId, roleDeniedId] },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["RBAC Services Write Allowed Role", "RBAC Services Write Denied Role"] },
      },
    });

    await prisma.service.deleteMany({
      where: {
        OR: [{ name: "RBAC Service Write Allowed" }, { name: "RBAC Service Write Denied" }],
      },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-services-write-company@teste.com" },
    });

    await prisma.$disconnect();
  });

  it("deve permitir POST /api/services para quem tem services:write", async () => {
    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${allowedToken}`)
      .send({
        name: "RBAC Service Write Allowed",
        price: 150,
        duration: 60,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("RBAC Service Write Allowed");
    expect(res.body.companyId).toBe(companyId);
  });

  it("deve negar POST /api/services para quem NÃO tem services:write", async () => {
    const res = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${deniedToken}`)
      .send({
        name: "RBAC Service Write Denied",
        price: 200,
        duration: 90,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Acesso negado");
  });
});
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - sales:read", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let allowedToken = "";
  let deniedToken = "";
  let clientId = "";
  let serviceId = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-sales-read-allow@teste.com", "rbac-sales-read-deny@teste.com"] } },
    });

    await prisma.rolePermission.deleteMany({
      where: { role: { name: { in: ["RBAC Sales Read Allowed Role", "RBAC Sales Read Denied Role"] } } },
    });

    await prisma.role.deleteMany({
      where: { name: { in: ["RBAC Sales Read Allowed Role", "RBAC Sales Read Denied Role"] } },
    });

    await prisma.sale.deleteMany({
      where: { paymentMethod: "RBAC_SALES_READ" },
    });

    await prisma.service.deleteMany({
      where: { name: "RBAC Sales Read Service" },
    });

    await prisma.client.deleteMany({
      where: { email: "rbac-sales-read-client@teste.com" },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-sales-read-company@teste.com" },
    });

    const company = await prisma.company.create({
      data: {
        name: "RBAC Sales Read Company",
        email: "rbac-sales-read-company@teste.com",
        phone: "11999991002",
        address: "Rua Sales Read",
        plan: "trial",
      },
    });
    companyId = company.id;

    const roleAllowed = await prisma.role.create({
      data: { name: "RBAC Sales Read Allowed Role", companyId },
    });

    const roleDenied = await prisma.role.create({
      data: { name: "RBAC Sales Read Denied Role", companyId },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const perm = await prisma.permission.upsert({
      where: { name: "sales:read" },
      update: {},
      create: { name: "sales:read" },
    });

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAllowedId, permissionId: perm.id } },
      update: {},
      create: { roleId: roleAllowedId, permissionId: perm.id },
    });

    const client = await prisma.client.create({
      data: {
        name: "RBAC Sales Read Client",
        email: "rbac-sales-read-client@teste.com",
        phone: "11999999100",
        companyId,
      },
    });
    clientId = client.id;

    const service = await prisma.service.create({
      data: {
        name: "RBAC Sales Read Service",
        price: 90,
        duration: 40,
        companyId,
      },
    });
    serviceId = service.id;

    await prisma.sale.create({
      data: {
        companyId,
        clientId,
        serviceId,
        amount: 190,
        paymentMethod: "RBAC_SALES_READ",
      },
    });

    const hash = await bcrypt.hash("123456", 10);
    const userAllowed = await prisma.user.create({
      data: {
        name: "Allowed",
        email: "rbac-sales-read-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    const userDenied = await prisma.user.create({
      data: {
        name: "Denied",
        email: "rbac-sales-read-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    allowedToken = jwt.sign({ userId: userAllowed.id, companyId, roleId: roleAllowedId }, process.env.JWT_SECRET as string);
    deniedToken = jwt.sign({ userId: userDenied.id, companyId, roleId: roleDeniedId }, process.env.JWT_SECRET as string);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-sales-read-allow@teste.com", "rbac-sales-read-deny@teste.com"] } },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.role.deleteMany({ where: { id: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.sale.deleteMany({ where: { companyId } });
    await prisma.service.deleteMany({ where: { id: serviceId || undefined } });
    await prisma.client.deleteMany({ where: { id: clientId || undefined } });
    await prisma.company.deleteMany({ where: { id: companyId || undefined } });
    await prisma.$disconnect();
  });

  it("permite GET /api/sales com sales:read", async () => {
    const res = await request(app).get("/api/sales").set("Authorization", `Bearer ${allowedToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("nega GET /api/sales sem sales:read", async () => {
    const res = await request(app).get("/api/sales").set("Authorization", `Bearer ${deniedToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Acesso negado");
  });
});
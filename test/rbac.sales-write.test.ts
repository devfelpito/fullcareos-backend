import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - sales:write", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let allowedToken = "";
  let deniedToken = "";
  let clientId = "";
  let serviceId = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ["rbac-sales-write-allow@teste.com", "rbac-sales-write-deny@teste.com"] },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        role: {
          name: { in: ["RBAC Sales Write Allowed Role", "RBAC Sales Write Denied Role"] },
        },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["RBAC Sales Write Allowed Role", "RBAC Sales Write Denied Role"] },
      },
    });

    await prisma.sale.deleteMany({
      where: {
        paymentMethod: { in: ["RBAC_ALLOWED", "RBAC_DENIED"] },
      },
    });

    await prisma.service.deleteMany({
      where: { name: "RBAC Sales Service" },
    });

    await prisma.client.deleteMany({
      where: { email: "rbac-sales-client@teste.com" },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-sales-write-company@teste.com" },
    });

    const company = await prisma.company.create({
      data: {
        name: "RBAC Sales Write Company",
        email: "rbac-sales-write-company@teste.com",
        phone: "11999990444",
        address: "Rua RBAC Sales, 400",
        plan: "trial",
      },
    });

    companyId = company.id;

    const roleAllowed = await prisma.role.create({
      data: {
        name: "RBAC Sales Write Allowed Role",
        companyId,
      },
    });

    const roleDenied = await prisma.role.create({
      data: {
        name: "RBAC Sales Write Denied Role",
        companyId,
      },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const permSalesWrite = await prisma.permission.upsert({
      where: { name: "sales:write" },
      update: {},
      create: { name: "sales:write" },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleAllowedId,
          permissionId: permSalesWrite.id,
        },
      },
      update: {},
      create: {
        roleId: roleAllowedId,
        permissionId: permSalesWrite.id,
      },
    });

    // entidades necessárias para criar sale
    const client = await prisma.client.create({
      data: {
        name: "RBAC Sales Client",
        email: "rbac-sales-client@teste.com",
        phone: "11977770000",
        companyId,
      },
    });
    clientId = client.id;

    const service = await prisma.service.create({
      data: {
        name: "RBAC Sales Service",
        price: 99.9,
        duration: 45,
        companyId,
      },
    });
    serviceId = service.id;

    const hash = await bcrypt.hash("123456", 10);

    await prisma.user.create({
      data: {
        name: "RBAC Sales Write Allowed User",
        email: "rbac-sales-write-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    await prisma.user.create({
      data: {
        name: "RBAC Sales Write Denied User",
        email: "rbac-sales-write-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    const loginAllowed = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-sales-write-allow@teste.com", password: "123456" });

    const loginDenied = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-sales-write-deny@teste.com", password: "123456" });

    expect(loginAllowed.status).toBe(200);
    expect(loginDenied.status).toBe(200);

    allowedToken = loginAllowed.body.token;
    deniedToken = loginDenied.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ["rbac-sales-write-allow@teste.com", "rbac-sales-write-deny@teste.com"] },
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: { in: [roleAllowedId, roleDeniedId] },
      },
    });

    await prisma.role.deleteMany({
      where: {
        name: { in: ["RBAC Sales Write Allowed Role", "RBAC Sales Write Denied Role"] },
      },
    });

    await prisma.sale.deleteMany({
      where: {
        paymentMethod: { in: ["RBAC_ALLOWED", "RBAC_DENIED"] },
      },
    });

    await prisma.service.deleteMany({
      where: { id: serviceId || undefined },
    });

    await prisma.client.deleteMany({
      where: { id: clientId || undefined },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-sales-write-company@teste.com" },
    });

    await prisma.$disconnect();
  });

  it("deve permitir POST /api/sales para quem tem sales:write", async () => {
    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${allowedToken}`)
      .send({
        clientId,
        serviceId,
        amount: 120.5,
        paymentMethod: "RBAC_ALLOWED",
      });

    expect(res.status).toBe(201);
    expect(res.body.companyId).toBe(companyId);
    expect(res.body.clientId).toBe(clientId);
  });

  it("deve negar POST /api/sales para quem NÃO tem sales:write", async () => {
    const res = await request(app)
      .post("/api/sales")
      .set("Authorization", `Bearer ${deniedToken}`)
      .send({
        clientId,
        serviceId,
        amount: 130,
        paymentMethod: "RBAC_DENIED",
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Acesso negado");
  });
});
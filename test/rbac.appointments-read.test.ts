import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - appointments:read", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let tokenAllowed = "";
  let tokenDenied = "";
  let clientId = "";
  let serviceId = "";
  let vehicleId = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-app-read-allow@teste.com", "rbac-app-read-deny@teste.com"] } },
    });

    await prisma.rolePermission.deleteMany({
      where: { role: { name: { in: ["RBAC App Read Allowed", "RBAC App Read Denied"] } } },
    });

    await prisma.role.deleteMany({
      where: { name: { in: ["RBAC App Read Allowed", "RBAC App Read Denied"] } },
    });

    await prisma.appointment.deleteMany({ where: { companyId: { not: "" } } });
    await prisma.vehicle.deleteMany({ where: { plate: "ARD-1001" } });
    await prisma.service.deleteMany({ where: { name: "RBAC App Read Service" } });
    await prisma.client.deleteMany({ where: { email: "rbac-app-read-client@teste.com" } });
    await prisma.company.deleteMany({ where: { email: "rbac-app-read-company@teste.com" } });

    const company = await prisma.company.create({
      data: {
        name: "RBAC App Read Company",
        email: "rbac-app-read-company@teste.com",
        phone: "11999992007",
        address: "Rua ARD",
        plan: "trial",
      },
    });
    companyId = company.id;

    const client = await prisma.client.create({
      data: {
        name: "App Read Client",
        email: "rbac-app-read-client@teste.com",
        phone: "11999992008",
        companyId,
      },
    });
    clientId = client.id;

    const service = await prisma.service.create({
      data: {
        name: "RBAC App Read Service",
        price: 100,
        duration: 30,
        companyId,
      },
    });
    serviceId = service.id;

    const vehicle = await prisma.vehicle.create({
      data: {
        clientId,
        companyId,
        model: "App Read Car",
        plate: "ARD-1001",
      },
    });
    vehicleId = vehicle.id;

    await prisma.appointment.create({
      data: {
        companyId,
        clientId,
        serviceId,
        vehicleId,
        scheduledAt: new Date(),
      },
    });

    const roleAllowed = await prisma.role.create({
      data: { name: "RBAC App Read Allowed", companyId },
    });
    const roleDenied = await prisma.role.create({
      data: { name: "RBAC App Read Denied", companyId },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const perm = await prisma.permission.upsert({
      where: { name: "appointments:read" },
      update: {},
      create: { name: "appointments:read" },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleAllowedId,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: roleAllowedId,
        permissionId: perm.id,
      },
    });

    const hash = await bcrypt.hash("123456", 10);

    await prisma.user.create({
      data: {
        name: "Allowed",
        email: "rbac-app-read-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    await prisma.user.create({
      data: {
        name: "Denied",
        email: "rbac-app-read-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    // 🔐 token via login real (em vez de jwt.sign manual)
    const loginAllowed = await request(app).post("/api/auth/login").send({
      email: "rbac-app-read-allow@teste.com",
      password: "123456",
    });

    const loginDenied = await request(app).post("/api/auth/login").send({
      email: "rbac-app-read-deny@teste.com",
      password: "123456",
    });

    expect(loginAllowed.status).toBe(200);
    expect(loginDenied.status).toBe(200);

    tokenAllowed = loginAllowed.body.token;
    tokenDenied = loginDenied.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-app-read-allow@teste.com", "rbac-app-read-deny@teste.com"] } },
    });
    await prisma.rolePermission.deleteMany({
      where: { roleId: { in: [roleAllowedId, roleDeniedId] } },
    });
    await prisma.role.deleteMany({
      where: { id: { in: [roleAllowedId, roleDeniedId] } },
    });
    await prisma.appointment.deleteMany({ where: { companyId } });
    await prisma.vehicle.deleteMany({ where: { id: vehicleId || undefined } });
    await prisma.service.deleteMany({ where: { id: serviceId || undefined } });
    await prisma.client.deleteMany({ where: { id: clientId || undefined } });
    await prisma.company.deleteMany({ where: { id: companyId || undefined } });
    await prisma.$disconnect();
  });

  it("permite GET /api/appointments com appointments:read", async () => {
    const res = await request(app)
      .get("/api/appointments")
      .set("Authorization", `Bearer ${tokenAllowed}`);
    expect(res.status).toBe(200);
  });

  it("nega GET /api/appointments sem appointments:read", async () => {
    const res = await request(app)
      .get("/api/appointments")
      .set("Authorization", `Bearer ${tokenDenied}`);
    expect(res.status).toBe(403);
  });
});
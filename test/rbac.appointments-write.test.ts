import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - appointments:write", () => {
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
      where: { email: { in: ["rbac-app-write-allow@teste.com", "rbac-app-write-deny@teste.com"] } },
    });

    await prisma.rolePermission.deleteMany({
      where: { role: { name: { in: ["RBAC App Write Allowed", "RBAC App Write Denied"] } } },
    });

    await prisma.role.deleteMany({
      where: { name: { in: ["RBAC App Write Allowed", "RBAC App Write Denied"] } },
    });

    await prisma.appointment.deleteMany({ where: { companyId: { not: "" } } });
    await prisma.vehicle.deleteMany({ where: { plate: "AWR-1001" } });
    await prisma.service.deleteMany({ where: { name: "RBAC App Write Service" } });
    await prisma.client.deleteMany({ where: { email: "rbac-app-write-client@teste.com" } });
    await prisma.company.deleteMany({ where: { email: "rbac-app-write-company@teste.com" } });

    const company = await prisma.company.create({
      data: {
        name: "RBAC App Write Company",
        email: "rbac-app-write-company@teste.com",
        phone: "11999992009",
        address: "Rua AWR",
        plan: "trial",
      },
    });
    companyId = company.id;

    const client = await prisma.client.create({
      data: { name: "App Write Client", email: "rbac-app-write-client@teste.com", phone: "11999992010", companyId },
    });
    clientId = client.id;

    const service = await prisma.service.create({
      data: { name: "RBAC App Write Service", price: 90, duration: 25, companyId },
    });
    serviceId = service.id;

    const vehicle = await prisma.vehicle.create({
      data: { clientId, companyId, model: "App Write Car", plate: "AWR-1001" },
    });
    vehicleId = vehicle.id;

    const roleAllowed = await prisma.role.create({ data: { name: "RBAC App Write Allowed", companyId } });
    const roleDenied = await prisma.role.create({ data: { name: "RBAC App Write Denied", companyId } });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const perm = await prisma.permission.upsert({
      where: { name: "appointments:write" },
      update: {},
      create: { name: "appointments:write" },
    });

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAllowedId, permissionId: perm.id } },
      update: {},
      create: { roleId: roleAllowedId, permissionId: perm.id },
    });

    const hash = await bcrypt.hash("123456", 10);
    await prisma.user.create({
      data: {
        name: "Allowed",
        email: "rbac-app-write-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    await prisma.user.create({
      data: {
        name: "Denied",
        email: "rbac-app-write-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    const loginAllowed = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-app-write-allow@teste.com", password: "123456" });

    const loginDenied = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-app-write-deny@teste.com", password: "123456" });

    expect(loginAllowed.status).toBe(200);
    expect(loginDenied.status).toBe(200);

    tokenAllowed = loginAllowed.body.token;
    tokenDenied = loginDenied.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-app-write-allow@teste.com", "rbac-app-write-deny@teste.com"] } },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.role.deleteMany({ where: { id: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.appointment.deleteMany({ where: { companyId } });
    await prisma.vehicle.deleteMany({ where: { id: vehicleId || undefined } });
    await prisma.service.deleteMany({ where: { id: serviceId || undefined } });
    await prisma.client.deleteMany({ where: { id: clientId || undefined } });
    await prisma.company.deleteMany({ where: { id: companyId || undefined } });
    await prisma.$disconnect();
  });

  it("permite POST /api/appointments com appointments:write", async () => {
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tokenAllowed}`)
      .send({
        clientId,
        vehicleId,
        serviceId,
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      });

    expect(res.status).toBe(201);
  });

  it("nega POST /api/appointments sem appointments:write", async () => {
    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${tokenDenied}`)
      .send({
        clientId,
        vehicleId,
        serviceId,
        scheduledAt: new Date(Date.now() + 7200000).toISOString(),
      });

    expect(res.status).toBe(403);
  });
});
import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - vehicles:read", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let tokenAllowed = "";
  let tokenDenied = "";
  let clientId = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-veh-read-allow@teste.com", "rbac-veh-read-deny@teste.com"] } },
    });

    await prisma.rolePermission.deleteMany({
      where: { role: { name: { in: ["RBAC Veh Read Allowed", "RBAC Veh Read Denied"] } } },
    });

    await prisma.role.deleteMany({
      where: { name: { in: ["RBAC Veh Read Allowed", "RBAC Veh Read Denied"] } },
    });

    await prisma.vehicle.deleteMany({
      where: { plate: "VRD-1001" },
    });

    await prisma.client.deleteMany({
      where: { email: "rbac-veh-read-client@teste.com" },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-veh-read-company@teste.com" },
    });

    const company = await prisma.company.create({
      data: {
        name: "RBAC Veh Read Company",
        email: "rbac-veh-read-company@teste.com",
        phone: "11999992001",
        address: "Rua VRD",
        plan: "trial",
      },
    });
    companyId = company.id;

    const client = await prisma.client.create({
      data: {
        name: "RBAC Veh Read Client",
        email: "rbac-veh-read-client@teste.com",
        phone: "11999992002",
        companyId,
      },
    });
    clientId = client.id;

    await prisma.vehicle.create({
      data: { clientId, companyId, model: "Carro VRD", plate: "VRD-1001" },
    });

    const roleAllowed = await prisma.role.create({
      data: { name: "RBAC Veh Read Allowed", companyId },
    });
    const roleDenied = await prisma.role.create({
      data: { name: "RBAC Veh Read Denied", companyId },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const perm = await prisma.permission.upsert({
      where: { name: "vehicles:read" },
      update: {},
      create: { name: "vehicles:read" },
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
        email: "rbac-veh-read-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    await prisma.user.create({
      data: {
        name: "Denied",
        email: "rbac-veh-read-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    const loginAllowed = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-veh-read-allow@teste.com", password: "123456" });

    const loginDenied = await request(app)
      .post("/api/auth/login")
      .send({ email: "rbac-veh-read-deny@teste.com", password: "123456" });

    expect(loginAllowed.status).toBe(200);
    expect(loginDenied.status).toBe(200);

    tokenAllowed = loginAllowed.body.token;
    tokenDenied = loginDenied.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-veh-read-allow@teste.com", "rbac-veh-read-deny@teste.com"] } },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.role.deleteMany({ where: { id: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.vehicle.deleteMany({ where: { companyId } });
    await prisma.client.deleteMany({ where: { id: clientId || undefined } });
    await prisma.company.deleteMany({ where: { id: companyId || undefined } });
    await prisma.$disconnect();
  });

  it("permite GET /api/vehicles com vehicles:read", async () => {
    const res = await request(app).get("/api/vehicles").set("Authorization", `Bearer ${tokenAllowed}`);
    expect(res.status).toBe(200);
  });

  it("nega GET /api/vehicles sem vehicles:read", async () => {
    const res = await request(app).get("/api/vehicles").set("Authorization", `Bearer ${tokenDenied}`);
    expect(res.status).toBe(403);
  });
});
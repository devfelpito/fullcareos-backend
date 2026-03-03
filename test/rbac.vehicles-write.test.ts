import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - vehicles:write", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let tokenAllowed = "";
  let tokenDenied = "";
  let clientId = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-veh-write-allow@teste.com", "rbac-veh-write-deny@teste.com"] } },
    });

    await prisma.rolePermission.deleteMany({
      where: { role: { name: { in: ["RBAC Veh Write Allowed", "RBAC Veh Write Denied"] } } },
    });

    await prisma.role.deleteMany({
      where: { name: { in: ["RBAC Veh Write Allowed", "RBAC Veh Write Denied"] } },
    });

    await prisma.vehicle.deleteMany({
      where: { plate: { in: ["VWR-1001", "VWR-1002"] } },
    });

    await prisma.client.deleteMany({
      where: { email: "rbac-veh-write-client@teste.com" },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-veh-write-company@teste.com" },
    });

    const company = await prisma.company.create({
      data: {
        name: "RBAC Veh Write Company",
        email: "rbac-veh-write-company@teste.com",
        phone: "11999992003",
        address: "Rua VWR",
        plan: "trial",
      },
    });
    companyId = company.id;

    const client = await prisma.client.create({
      data: {
        name: "RBAC Veh Write Client",
        email: "rbac-veh-write-client@teste.com",
        phone: "11999992004",
        companyId,
      },
    });
    clientId = client.id;

    const roleAllowed = await prisma.role.create({
      data: { name: "RBAC Veh Write Allowed", companyId },
    });
    const roleDenied = await prisma.role.create({
      data: { name: "RBAC Veh Write Denied", companyId },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const perm = await prisma.permission.upsert({
      where: { name: "vehicles:write" },
      update: {},
      create: { name: "vehicles:write" },
    });

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleAllowedId, permissionId: perm.id } },
      update: {},
      create: { roleId: roleAllowedId, permissionId: perm.id },
    });

    const hash = await bcrypt.hash("123456", 10);

    const userAllowed = await prisma.user.create({
      data: {
        name: "Allowed",
        email: "rbac-veh-write-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    const userDenied = await prisma.user.create({
      data: {
        name: "Denied",
        email: "rbac-veh-write-deny@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleDeniedId,
      },
    });

    tokenAllowed = jwt.sign({ userId: userAllowed.id, companyId, roleId: roleAllowedId }, process.env.JWT_SECRET as string);
    tokenDenied = jwt.sign({ userId: userDenied.id, companyId, roleId: roleDeniedId }, process.env.JWT_SECRET as string);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-veh-write-allow@teste.com", "rbac-veh-write-deny@teste.com"] } },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.role.deleteMany({ where: { id: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.vehicle.deleteMany({ where: { companyId } });
    await prisma.client.deleteMany({ where: { id: clientId || undefined } });
    await prisma.company.deleteMany({ where: { id: companyId || undefined } });
    await prisma.$disconnect();
  });

  it("permite POST /api/vehicles com vehicles:write", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${tokenAllowed}`)
      .send({ clientId, model: "Carro Novo", plate: "VWR-1001" });

    expect(res.status).toBe(201);
  });

  it("nega POST /api/vehicles sem vehicles:write", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${tokenDenied}`)
      .send({ clientId, model: "Carro Negado", plate: "VWR-1002" });

    expect(res.status).toBe(403);
  });
});
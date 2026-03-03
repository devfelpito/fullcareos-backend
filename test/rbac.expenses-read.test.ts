import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - expenses:read", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let tokenAllowed = "";
  let tokenDenied = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-exp-read-allow@teste.com", "rbac-exp-read-deny@teste.com"] } },
    });

    await prisma.rolePermission.deleteMany({
      where: { role: { name: { in: ["RBAC Exp Read Allowed", "RBAC Exp Read Denied"] } } },
    });

    await prisma.role.deleteMany({
      where: { name: { in: ["RBAC Exp Read Allowed", "RBAC Exp Read Denied"] } },
    });

    await prisma.expense.deleteMany({
      where: { description: "RBAC Expense Read Seed" },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-exp-read-company@teste.com" },
    });

    const company = await prisma.company.create({
      data: {
        name: "RBAC Exp Read Company",
        email: "rbac-exp-read-company@teste.com",
        phone: "11999992005",
        address: "Rua ERD",
        plan: "trial",
      },
    });
    companyId = company.id;

    await prisma.expense.create({
      data: { companyId, description: "RBAC Expense Read Seed", amount: 99 },
    });

    const roleAllowed = await prisma.role.create({
      data: { name: "RBAC Exp Read Allowed", companyId },
    });
    const roleDenied = await prisma.role.create({
      data: { name: "RBAC Exp Read Denied", companyId },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const perm = await prisma.permission.upsert({
      where: { name: "expenses:read" },
      update: {},
      create: { name: "expenses:read" },
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
        email: "rbac-exp-read-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    const userDenied = await prisma.user.create({
      data: {
        name: "Denied",
        email: "rbac-exp-read-deny@teste.com",
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
      where: { email: { in: ["rbac-exp-read-allow@teste.com", "rbac-exp-read-deny@teste.com"] } },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.role.deleteMany({ where: { id: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.expense.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId || undefined } });
    await prisma.$disconnect();
  });

  it("permite GET /api/expenses com expenses:read", async () => {
    const res = await request(app).get("/api/expenses").set("Authorization", `Bearer ${tokenAllowed}`);
    expect(res.status).toBe(200);
  });

  it("nega GET /api/expenses sem expenses:read", async () => {
    const res = await request(app).get("/api/expenses").set("Authorization", `Bearer ${tokenDenied}`);
    expect(res.status).toBe(403);
  });
});
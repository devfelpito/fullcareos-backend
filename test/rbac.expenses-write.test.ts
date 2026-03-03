import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("RBAC - expenses:write", () => {
  let companyId = "";
  let roleAllowedId = "";
  let roleDeniedId = "";
  let tokenAllowed = "";
  let tokenDenied = "";

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["rbac-exp-write-allow@teste.com", "rbac-exp-write-deny@teste.com"] } },
    });

    await prisma.rolePermission.deleteMany({
      where: { role: { name: { in: ["RBAC Exp Write Allowed", "RBAC Exp Write Denied"] } } },
    });

    await prisma.role.deleteMany({
      where: { name: { in: ["RBAC Exp Write Allowed", "RBAC Exp Write Denied"] } },
    });

    await prisma.expense.deleteMany({
      where: { description: { in: ["RBAC Expense Write Allowed", "RBAC Expense Write Denied"] } },
    });

    await prisma.company.deleteMany({
      where: { email: "rbac-exp-write-company@teste.com" },
    });

    const company = await prisma.company.create({
      data: {
        name: "RBAC Exp Write Company",
        email: "rbac-exp-write-company@teste.com",
        phone: "11999992006",
        address: "Rua EWR",
        plan: "trial",
      },
    });
    companyId = company.id;

    const roleAllowed = await prisma.role.create({
      data: { name: "RBAC Exp Write Allowed", companyId },
    });
    const roleDenied = await prisma.role.create({
      data: { name: "RBAC Exp Write Denied", companyId },
    });

    roleAllowedId = roleAllowed.id;
    roleDeniedId = roleDenied.id;

    const perm = await prisma.permission.upsert({
      where: { name: "expenses:write" },
      update: {},
      create: { name: "expenses:write" },
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
        email: "rbac-exp-write-allow@teste.com",
        password: hash,
        active: true,
        companyId,
        roleId: roleAllowedId,
      },
    });

    const userDenied = await prisma.user.create({
      data: {
        name: "Denied",
        email: "rbac-exp-write-deny@teste.com",
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
      where: { email: { in: ["rbac-exp-write-allow@teste.com", "rbac-exp-write-deny@teste.com"] } },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.role.deleteMany({ where: { id: { in: [roleAllowedId, roleDeniedId] } } });
    await prisma.expense.deleteMany({ where: { companyId } });
    await prisma.company.deleteMany({ where: { id: companyId || undefined } });
    await prisma.$disconnect();
  });

  it("permite POST /api/expenses com expenses:write", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${tokenAllowed}`)
      .send({ description: "RBAC Expense Write Allowed", amount: 150 });

    expect(res.status).toBe(201);
  });

  it("nega POST /api/expenses sem expenses:write", async () => {
    const res = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${tokenDenied}`)
      .send({ description: "RBAC Expense Write Denied", amount: 80 });

    expect(res.status).toBe(403);
  });
});
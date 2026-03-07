import request from "supertest";
import app from "../src/server";
import { prisma } from "../src/prisma";

describe("Onboarding /api/onboarding/register", () => {
  const suffix = Date.now();
  const companyEmail = `onboarding-company-${suffix}@teste.com`;
  const adminEmail = `onboarding-admin-${suffix}@teste.com`;
  let companyId = "";
  let roleId = "";
  let userId = "";

  afterAll(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }

    if (roleId) {
      await prisma.rolePermission.deleteMany({ where: { roleId } });
      await prisma.role.deleteMany({ where: { id: roleId } });
    }

    if (companyId) {
      await prisma.company.deleteMany({ where: { id: companyId } });
    }

    await prisma.$disconnect();
  });

  it("deve criar empresa e admin no onboarding", async () => {
    const res = await request(app)
      .post("/api/onboarding/register")
      .send({
        companyName: "Onboarding Oficina",
        companyEmail,
        phone: "11999998888",
        address: "Rua Teste, 123",
        adminName: "Admin Onboarding",
        adminEmail,
        adminPassword: "senhaSegura123",
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.company.email).toBe(companyEmail);
    expect(res.body.user.email).toBe(adminEmail);

    companyId = res.body.company.id;
    userId = res.body.user.id;

    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser).toBeTruthy();
    roleId = dbUser!.roleId;
  });
});

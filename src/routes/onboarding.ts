import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { validateBody } from "../middleware/validate";
import { onboardingSchema } from "../validation/schemas";
import { SYSTEM_PERMISSIONS } from "../constants/permissions";

const router = Router();

router.post("/register", validateBody(onboardingSchema), async (req, res, next) => {
  const {
    companyName,
    companyEmail,
    phone,
    address,
    adminName,
    adminEmail,
    adminPassword,
  } = req.body;

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: companyEmail,
          phone,
          address,
          plan: "trial",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      const adminRole = await tx.role.create({
        data: {
          name: "Admin",
          description: "Acesso total ao sistema",
          companyId: company.id,
        },
      });

      const permissions = await Promise.all(
        SYSTEM_PERMISSIONS.map((name) =>
          tx.permission.upsert({
            where: { name },
            update: {},
            create: { name },
          })
        )
      );

      await Promise.all(
        permissions.map((permission) =>
          tx.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          })
        )
      );

      const user = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: passwordHash,
          active: true,
          companyId: company.id,
          roleId: adminRole.id,
        },
      });

      return { company, user };
    });

    const token = jwt.sign(
      {
        userId: result.user.id,
        companyId: result.company.id,
        roleId: result.user.roleId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Onboarding concluído com sucesso",
      token,
      company: {
        id: result.company.id,
        name: result.company.name,
        email: result.company.email,
        plan: result.company.plan,
        trialEndsAt: result.company.trialEndsAt,
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        companyId: result.user.companyId,
        roleId: result.user.roleId,
      },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "Empresa ou usuário já cadastrado" });
    }
    next(err);
  }
});

export default router;

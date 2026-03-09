import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { validateBody } from "../middleware/validate";
import { onboardingSchema } from "../validation/schemas";
import { SYSTEM_PERMISSIONS } from "../constants/permissions";
import { makeUniqueSlug } from "../utils/slug";
import { createPlainToken, hashToken } from "../utils/token";
import { sendVerificationEmail } from "../services/email";

const router = Router();

router.post("/register", validateBody(onboardingSchema), async (req, res, next) => {
  const {
    companyName,
    companySlug,
    companyEmail,
    phone,
    address,
    adminName,
    adminEmail,
    adminPassword,
  } = req.body;
  const normalizedCompanyEmail = String(companyEmail).trim().toLowerCase();
  const normalizedAdminEmail = String(adminEmail).trim().toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminVerificationPlainToken = createPlainToken();
    const adminVerificationToken = hashToken(adminVerificationPlainToken);

    const slug = await makeUniqueSlug(companySlug || companyName, async (candidate) => {
      const exists = await prisma.company.findFirst({ where: { slug: candidate }, select: { id: true } });
      return Boolean(exists);
    });

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          slug,
          name: companyName,
          email: normalizedCompanyEmail,
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

      await tx.service.createMany({
        data: [
          { companyId: company.id, category: "lavagem_polimento", name: "Lavagem detalhada", price: 120, duration: 90 },
          { companyId: company.id, category: "lavagem_polimento", name: "Polimento", price: 350, duration: 180 },
          { companyId: company.id, category: "lavagem_polimento", name: "Polimento cristalizado", price: 500, duration: 240 },
          { companyId: company.id, category: "protecao_estetica", name: "Vitrificação", price: 900, duration: 360 },
          { companyId: company.id, category: "protecao_estetica", name: "Aplicação de PPF", price: 1800, duration: 480 },
          { companyId: company.id, category: "reparos_rapidos", name: "Martelinho de ouro", price: 250, duration: 120 },
        ],
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
          email: normalizedAdminEmail,
          password: passwordHash,
          verificationToken: adminVerificationToken,
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

    await sendVerificationEmail({
      to: result.user.email,
      companySlug: result.company.slug,
      email: result.user.email,
      token: adminVerificationPlainToken,
      customer: false,
    });

    return res.status(201).json({
      message: "Onboarding concluído com sucesso",
      token,
      company: {
        id: result.company.id,
        slug: result.company.slug,
        name: result.company.name,
        email: result.company.email,
        plan: result.company.plan,
        trialEndsAt: result.company.trialEndsAt,
        customerPortalBaseUrl: `/c/${result.company.slug}`,
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

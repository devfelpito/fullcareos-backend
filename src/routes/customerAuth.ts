import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { validateBody } from "../middleware/validate";
import {
  customerForgotPasswordSchema,
  customerLoginSchema,
  customerRegisterSchema,
  customerResetPasswordSchema,
  customerVerifyEmailSchema,
} from "../validation/schemas";
import { createPlainToken, hashToken } from "../utils/token";
import { sendResetPasswordEmail, sendVerificationEmail } from "../services/email";

const router = Router();

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function getCompanyBySlug(companySlug: string) {
  return prisma.company.findFirst({ where: { slug: companySlug } });
}

router.post("/:companySlug/register", validateBody(customerRegisterSchema), async (req, res, next) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const email = normalizeEmail(req.body.email);

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return res.status(404).json({ message: "Empresa não encontrada" });
    }

    const existing = await prisma.customerAccount.findUnique({
      where: {
        companyId_email: {
          companyId: company.id,
          email,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ message: "Cliente já possui conta" });
    }

    const client =
      (await prisma.client.findFirst({ where: { companyId: company.id, email } })) ||
      (await prisma.client.create({
        data: {
          companyId: company.id,
          name: req.body.name,
          email,
          phone: req.body.phone,
        },
      }));

    const plainVerificationToken = createPlainToken();
    const verificationToken = hashToken(plainVerificationToken);
    const passwordHash = await bcrypt.hash(req.body.password, 10);

    await prisma.customerAccount.create({
      data: {
        companyId: company.id,
        clientId: client.id,
        email,
        password: passwordHash,
        verificationToken,
      },
    });

    await sendVerificationEmail({
      to: email,
      companySlug,
      email,
      token: plainVerificationToken,
      customer: true,
    });

    return res.status(201).json({
      message: "Cadastro realizado. Verifique seu e-mail para ativar a conta.",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:companySlug/verify-email", validateBody(customerVerifyEmailSchema), async (req, res, next) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const email = normalizeEmail(req.body.email);
    const tokenHash = hashToken(req.body.token);

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return res.status(404).json({ message: "Empresa não encontrada" });
    }

    const account = await prisma.customerAccount.findUnique({
      where: {
        companyId_email: {
          companyId: company.id,
          email,
        },
      },
    });

    if (!account || !account.verificationToken || account.verificationToken !== tokenHash) {
      return res.status(400).json({ message: "Token de verificação inválido" });
    }

    await prisma.customerAccount.update({
      where: { id: account.id },
      data: {
        emailVerifiedAt: new Date(),
        verificationToken: null,
      },
    });

    return res.status(200).json({ message: "E-mail verificado com sucesso" });
  } catch (err) {
    next(err);
  }
});

router.post("/:companySlug/login", validateBody(customerLoginSchema), async (req, res, next) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const email = normalizeEmail(req.body.email);

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const account = await prisma.customerAccount.findUnique({
      where: {
        companyId_email: {
          companyId: company.id,
          email,
        },
      },
      include: {
        client: true,
      },
    });

    if (!account) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const validPassword = await bcrypt.compare(req.body.password, account.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    if (!account.emailVerifiedAt) {
      return res.status(403).json({ message: "Verifique seu e-mail antes de entrar" });
    }

    const token = jwt.sign(
      {
        customerAccountId: account.id,
        clientId: account.clientId,
        companyId: company.id,
        role: "customer",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token,
      customer: {
        id: account.id,
        email: account.email,
        companyId: account.companyId,
        companySlug,
        client: {
          id: account.client.id,
          name: account.client.name,
          phone: account.client.phone,
          email: account.client.email,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:companySlug/forgot-password", validateBody(customerForgotPasswordSchema), async (req, res, next) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const email = normalizeEmail(req.body.email);

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return res.status(200).json({ message: "Se o e-mail existir, enviaremos as instruções" });
    }

    const account = await prisma.customerAccount.findUnique({
      where: {
        companyId_email: {
          companyId: company.id,
          email,
        },
      },
    });

    if (!account) {
      return res.status(200).json({ message: "Se o e-mail existir, enviaremos as instruções" });
    }

    const plainResetToken = createPlainToken();
    const resetToken = hashToken(plainResetToken);

    await prisma.customerAccount.update({
      where: { id: account.id },
      data: {
        resetToken,
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await sendResetPasswordEmail({
      to: email,
      companySlug,
      email,
      token: plainResetToken,
      customer: true,
    });

    return res.status(200).json({ message: "Se o e-mail existir, enviaremos as instruções" });
  } catch (err) {
    next(err);
  }
});

router.post("/:companySlug/reset-password", validateBody(customerResetPasswordSchema), async (req, res, next) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const email = normalizeEmail(req.body.email);
    const resetToken = hashToken(req.body.token);

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return res.status(400).json({ message: "Token inválido ou expirado" });
    }

    const account = await prisma.customerAccount.findUnique({
      where: {
        companyId_email: {
          companyId: company.id,
          email,
        },
      },
    });

    if (
      !account ||
      !account.resetToken ||
      account.resetToken !== resetToken ||
      !account.resetTokenExpiresAt ||
      account.resetTokenExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({ message: "Token inválido ou expirado" });
    }

    const passwordHash = await bcrypt.hash(req.body.newPassword, 10);

    await prisma.customerAccount.update({
      where: { id: account.id },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return res.status(200).json({ message: "Senha redefinida com sucesso" });
  } catch (err) {
    next(err);
  }
});

export default router;

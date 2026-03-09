import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { validateBody } from "../middleware/validate";
import {
  authForgotPasswordSchema,
  authResetPasswordSchema,
  authVerifyEmailSchema,
  loginSchema,
} from "../validation/schemas";
import loginRateLimit from "../middleware/loginRateLimit";
import { createPlainToken, hashToken } from "../utils/token";
import { sendResetPasswordEmail, sendVerificationEmail } from "../services/email";

const router = Router();

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

router.post("/login", loginRateLimit, validateBody(loginSchema), async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    if (!user.emailVerifiedAt && process.env.NODE_ENV !== "test") {
      return res.status(403).json({ message: "Verifique seu e-mail antes de entrar" });
    }

    const token = jwt.sign(
      { userId: user.id, companyId: user.companyId, roleId: user.roleId },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      companyId: user.companyId,
      roleId: user.roleId,
      active: user.active,
      createdAt: user.createdAt,
    };

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-email", validateBody(authVerifyEmailSchema), async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const tokenHash = hashToken(req.body.token);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: { slug: true },
        },
      },
    });

    if (!user || !user.verificationToken || user.verificationToken !== tokenHash) {
      return res.status(400).json({ message: "Token de verificação inválido" });
    }

    await prisma.user.update({
      where: { id: user.id },
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

router.post("/forgot-password", validateBody(authForgotPasswordSchema), async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: { slug: true },
        },
      },
    });

    if (!user) {
      return res.status(200).json({ message: "Se o e-mail existir, enviaremos as instruções" });
    }

    const plainToken = createPlainToken();
    const tokenHash = hashToken(plainToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await sendResetPasswordEmail({
      to: user.email,
      companySlug: user.company.slug,
      email: user.email,
      token: plainToken,
      customer: false,
    });

    return res.status(200).json({ message: "Se o e-mail existir, enviaremos as instruções" });
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password", validateBody(authResetPasswordSchema), async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const tokenHash = hashToken(req.body.token);

    const user = await prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      !user.resetToken ||
      user.resetToken !== tokenHash ||
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({ message: "Token inválido ou expirado" });
    }

    const passwordHash = await bcrypt.hash(req.body.newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
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

router.post("/resend-verification", validateBody(authForgotPasswordSchema), async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: { slug: true },
        },
      },
    });

    if (!user || user.emailVerifiedAt) {
      return res.status(200).json({ message: "Se o usuário existir, enviaremos a verificação" });
    }

    const plainToken = createPlainToken();
    const tokenHash = hashToken(plainToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: tokenHash,
      },
    });

    await sendVerificationEmail({
      to: user.email,
      companySlug: user.company.slug,
      email: user.email,
      token: plainToken,
      customer: false,
    });

    return res.status(200).json({ message: "Se o usuário existir, enviaremos a verificação" });
  } catch (err) {
    next(err);
  }
});

export default router;

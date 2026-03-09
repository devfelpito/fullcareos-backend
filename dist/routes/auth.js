"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../prisma");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validation/schemas");
const loginRateLimit_1 = __importDefault(require("../middleware/loginRateLimit"));
const token_1 = require("../utils/token");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
function normalizeEmail(value) {
    return value.trim().toLowerCase();
}
router.post("/login", loginRateLimit_1.default, (0, validate_1.validateBody)(schemas_1.loginSchema), async (req, res, next) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.active) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }
        const valid = await bcrypt_1.default.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }
        if (!user.emailVerifiedAt && process.env.NODE_ENV !== "test") {
            return res.status(403).json({ message: "Verifique seu e-mail antes de entrar" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, companyId: user.companyId, roleId: user.roleId }, process.env.JWT_SECRET, { expiresIn: "7d" });
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
    }
    catch (err) {
        next(err);
    }
});
router.post("/verify-email", (0, validate_1.validateBody)(schemas_1.authVerifyEmailSchema), async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const tokenHash = (0, token_1.hashToken)(req.body.token);
        const user = await prisma_1.prisma.user.findUnique({
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
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifiedAt: new Date(),
                verificationToken: null,
            },
        });
        return res.status(200).json({ message: "E-mail verificado com sucesso" });
    }
    catch (err) {
        next(err);
    }
});
router.post("/forgot-password", (0, validate_1.validateBody)(schemas_1.authForgotPasswordSchema), async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const user = await prisma_1.prisma.user.findUnique({
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
        const plainToken = (0, token_1.createPlainToken)();
        const tokenHash = (0, token_1.hashToken)(plainToken);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: tokenHash,
                resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });
        await (0, email_1.sendResetPasswordEmail)({
            to: user.email,
            companySlug: user.company.slug,
            email: user.email,
            token: plainToken,
            customer: false,
        });
        return res.status(200).json({ message: "Se o e-mail existir, enviaremos as instruções" });
    }
    catch (err) {
        next(err);
    }
});
router.post("/reset-password", (0, validate_1.validateBody)(schemas_1.authResetPasswordSchema), async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const tokenHash = (0, token_1.hashToken)(req.body.token);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user ||
            !user.resetToken ||
            user.resetToken !== tokenHash ||
            !user.resetTokenExpiresAt ||
            user.resetTokenExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({ message: "Token inválido ou expirado" });
        }
        const passwordHash = await bcrypt_1.default.hash(req.body.newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: passwordHash,
                resetToken: null,
                resetTokenExpiresAt: null,
            },
        });
        return res.status(200).json({ message: "Senha redefinida com sucesso" });
    }
    catch (err) {
        next(err);
    }
});
router.post("/resend-verification", (0, validate_1.validateBody)(schemas_1.authForgotPasswordSchema), async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const user = await prisma_1.prisma.user.findUnique({
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
        const plainToken = (0, token_1.createPlainToken)();
        const tokenHash = (0, token_1.hashToken)(plainToken);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken: tokenHash,
            },
        });
        await (0, email_1.sendVerificationEmail)({
            to: user.email,
            companySlug: user.company.slug,
            email: user.email,
            token: plainToken,
            customer: false,
        });
        return res.status(200).json({ message: "Se o usuário existir, enviaremos a verificação" });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
router.post("/login", (0, validate_1.validateBody)(schemas_1.loginSchema), async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const valid = await bcrypt_1.default.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ message: "Senha inválida" });
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
exports.default = router;

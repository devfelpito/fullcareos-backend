"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado" });
        const valid = await bcrypt_1.default.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ message: "Senha inválida" });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, companyId: user.companyId }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

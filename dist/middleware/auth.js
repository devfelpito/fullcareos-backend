"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../prisma");
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ message: "JWT_SECRET não configurado" });
        }
        const token = authHeader.slice(7);
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                roleId: true,
                companyId: true,
                active: true,
            },
        });
        if (!user || !user.active) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }
        req.user = {
            id: user.id,
            userId: user.id,
            roleId: user.roleId,
            companyId: user.companyId,
        };
        next();
    }
    catch (_err) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
const client_1 = require("@prisma/client");
function errorHandler(err, _req, res, _next) {
    if (res.headersSent)
        return;
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2025":
                return res.status(404).json({ message: "Registro não encontrado" });
            case "P2002":
                return res.status(409).json({ message: "Registro já existe com esses dados" });
            case "P2003":
                return res.status(400).json({ message: "Referência inválida" });
            default:
                return res.status(500).json({ message: "Erro ao processar operação" });
        }
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return res.status(400).json({ message: "Dados inválidos" });
    }
    return res.status(500).json({ message: "Erro interno do servidor" });
}

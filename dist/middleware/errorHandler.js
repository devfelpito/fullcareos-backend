"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
const client_1 = require("@prisma/client");
/**
 * Middleware centralizado de tratamento de erros.
 * Evita vazamento de logs internos do Prisma e detalhes sensíveis.
 */
function errorHandler(err, _req, res, _next) {
    if (res.headersSent)
        return;
    // Erros conhecidos do Prisma - mapear para mensagens genéricas
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2025":
                return res.status(404).json({ error: "Registro não encontrado" });
            case "P2002":
                return res.status(409).json({ error: "Registro já existe com esses dados" });
            case "P2003":
                return res.status(400).json({ error: "Referência inválida" });
            default:
                return res.status(500).json({ error: "Erro ao processar operação" });
        }
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return res.status(400).json({ error: "Dados inválidos" });
    }
    // Erro genérico
    return res.status(500).json({ error: "Erro interno do servidor" });
}

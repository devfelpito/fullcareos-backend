import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export default function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (res.headersSent) return;

  console.error("[error]", err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
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

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ message: "Dados inválidos" });
  }

  return res.status(500).json({ message: "Erro interno do servidor" });
}

import { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma";

export default async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user as { companyId?: string } | undefined;
    const companyId = user?.companyId;

    if (!companyId) {
      return res.status(401).json({ message: "Tenant nao informado" });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return res.status(404).json({ message: "Empresa nao encontrada" });
    }

    (req as any).tenantId = companyId;
    next();
  } catch (err) {
    next(err);
  }
}

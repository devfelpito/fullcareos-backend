 // filepath: c:\Users\danie\fullcareos\backend\src\middleware\tenant.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";

export default async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || !user.companyId) return res.status(401).json({ message: "Tenant não informado" });

  try {
    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) return res.status(404).json({ message: "Empresa não encontrada" });

    (req as any).tenantId = user.companyId;
    next();
  } catch (err) {
    next(err);
  }
}

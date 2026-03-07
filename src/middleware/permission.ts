import { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma";

export function requirePermission(permissionName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as { roleId?: string } | undefined;
      const tenantId = (req as any).tenantId as string | undefined;

      if (!user?.roleId || !tenantId) {
        return res.status(401).json({ message: "Usuario nao autenticado" });
      }

      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: user.roleId,
          role: { companyId: tenantId },
          permission: { name: permissionName },
        },
      });

      if (!rolePermission) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

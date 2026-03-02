import { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma";

export function requirePermission(permissionName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user?.roleId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          roleId: user.roleId,
          permission: { name: permissionName },
        },
        include: { permission: true },
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
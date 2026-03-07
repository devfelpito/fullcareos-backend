import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

type JwtPayload = {
  userId: string;
  companyId: string;
  roleId: string;
};

export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
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
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await prisma.user.findUnique({
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

    (req as any).user = {
      id: user.id,
      userId: user.id,
      roleId: user.roleId,
      companyId: user.companyId,
    };

    next();
  } catch (_err) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
}

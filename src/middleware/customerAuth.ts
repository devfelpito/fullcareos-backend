import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

type CustomerJwtPayload = {
  customerAccountId: string;
  clientId: string;
  companyId: string;
  role: "customer";
};

export default async function customerAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Cliente não autenticado" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET não configurado" });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, secret) as CustomerJwtPayload;

    if (decoded.role !== "customer") {
      return res.status(401).json({ message: "Cliente não autenticado" });
    }

    const account = await prisma.customerAccount.findUnique({
      where: { id: decoded.customerAccountId },
      select: {
        id: true,
        clientId: true,
        companyId: true,
        emailVerifiedAt: true,
      },
    });

    if (!account || !account.emailVerifiedAt) {
      return res.status(401).json({ message: "Cliente não autenticado" });
    }

    (req as any).customer = {
      customerAccountId: account.id,
      clientId: account.clientId,
      companyId: account.companyId,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Cliente não autenticado" });
  }
}

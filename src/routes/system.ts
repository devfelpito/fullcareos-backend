import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/health", (_req, res) => {
  return res.status(200).json({
    message: "ok",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

router.get("/readiness", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      message: "ok",
      status: "ready",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(503).json({
      message: "Serviço indisponível",
      status: "not_ready",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

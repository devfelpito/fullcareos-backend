 // filepath: c:\Users\danie\fullcareos\backend\src\routes\client.ts
import express from "express";
import authMiddleware from "../middleware/auth";
import tenantMiddleware from "../middleware/tenant";
import { tenantPrisma } from "../utils/tenantPrisma";

const router = express.Router();

// aplica tenantMiddleware para todas as rotas deste router
router.use(authMiddleware);
router.use(tenantMiddleware);

// listar clientes do tenant
router.get("/", async (req, res, next) => {
  try {
    const tprisma = tenantPrisma((req as any).tenantId);
    const clients = await tprisma.client.findMany({});
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

// criar cliente (companyId injetado automaticamente)
router.post("/", async (req, res, next) => {
  try {
    const tprisma = tenantPrisma((req as any).tenantId);
    const data = req.body;
    const client = await tprisma.client.create({ data });
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
});

export default router;
module.exports = router;

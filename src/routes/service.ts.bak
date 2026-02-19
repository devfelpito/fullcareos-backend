import { Router } from "express";
import { prisma } from "../prisma"; 
import  authMiddleware from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// LISTAR SERVIÇOS
router.get("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const services = await prisma.service.findMany({ where: { companyId } });
  res.json(services);
});

// CRIAR SERVIÇO
router.post("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const { name, price, duration } = req.body;

  const service = await prisma.service.create({
    data: { name, price, duration, companyId }
  });
  res.json(service);
});

export default router;
module.exports = router;

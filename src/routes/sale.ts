import { Router } from "express";
import { prisma } from "../prisma"; 
import  authMiddleware from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// LISTAR VENDAS
router.get("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const sales = await prisma.sale.findMany({ where: { companyId } });
  res.json(sales);
});

// CRIAR VENDA
router.post("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const { clientId, serviceId, amount, paymentMethod } = req.body;

  const sale = await prisma.sale.create({
    data: { clientId, serviceId, amount, paymentMethod, companyId }
  });
  res.json(sale);
});

export default router;
module.exports = router;

import { Router } from "express";
import { prisma } from "../prisma"; 
import  authMiddleware  from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// LISTAR DESPESAS
router.get("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const expenses = await prisma.expense.findMany({ where: { companyId } });
  res.json(expenses);
});

// CRIAR DESPESA
router.post("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const { description, amount } = req.body;

  const expense = await prisma.expense.create({
    data: { description, amount, companyId }
  });
  res.json(expense);
});

export default router;
module.exports = router;

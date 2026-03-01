import { Router } from "express";
import authMiddleware from "../middleware/auth";
import tenantMiddleware from "../middleware/tenant";
import { tenantPrisma } from "../utils/tenantPrisma";

const router = Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", async (req, res, next) => {
  try {
    const tprisma = tenantPrisma((req as any).tenantId);
    const expenses = await tprisma.expense.findMany({});
    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const tprisma = tenantPrisma((req as any).tenantId);
    const { description, amount } = req.body;
    const expense = await tprisma.expense.create({
      data: { description, amount }
    });
    res.json(expense);
  } catch (err) {
    next(err);
  }
});

export default router;

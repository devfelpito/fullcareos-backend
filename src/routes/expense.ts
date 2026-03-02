import { Router } from "express";
import { prisma } from "../prisma";
import authMiddleware from "../middleware/auth";
import tenantMiddleware from "../middleware/tenant";
import { requirePermission } from "../middleware/permission";
import { validateBody } from "../middleware/validate";
import { createExpenseSchema } from "../validation/schemas";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", requirePermission("expenses:read"), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const expenses = await prisma.expense.findMany({
      where: { companyId: tenantId },
    });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requirePermission("expenses:write"),
  validateBody(createExpenseSchema),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const { description, amount } = req.body;

      const expense = await prisma.expense.create({
        data: { description, amount, companyId: tenantId },
      });

      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
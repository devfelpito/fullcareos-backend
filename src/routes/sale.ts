import { Router } from "express";
import { prisma } from "../prisma";
import authMiddleware from "../middleware/auth";
import tenantMiddleware from "../middleware/tenant";
import { requirePermission } from "../middleware/permission";
import { validateBody } from "../middleware/validate";
import { createSaleSchema } from "../validation/schemas";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", requirePermission("sales:read"), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const sales = await prisma.sale.findMany({
      where: { companyId: tenantId },
    });
    res.json(sales);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requirePermission("sales:write"),
  validateBody(createSaleSchema),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const { clientId, serviceId, amount, paymentMethod } = req.body;

      const sale = await prisma.sale.create({
        data: { clientId, serviceId, amount, paymentMethod, companyId: tenantId },
      });

      res.status(201).json(sale);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
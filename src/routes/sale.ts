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
    const sales = await tprisma.sale.findMany({});
    res.json(sales);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const tprisma = tenantPrisma((req as any).tenantId);
    const { clientId, serviceId, amount, paymentMethod } = req.body;
    const sale = await tprisma.sale.create({
      data: { clientId, serviceId, amount, paymentMethod }
    });
    res.json(sale);
  } catch (err) {
    next(err);
  }
});

export default router;

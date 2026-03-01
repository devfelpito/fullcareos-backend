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
    const services = await tprisma.service.findMany({});
    res.json(services);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const tprisma = tenantPrisma((req as any).tenantId);
    const { name, price, duration } = req.body;
    const service = await tprisma.service.create({
      data: { name, price, duration }
    });
    res.json(service);
  } catch (err) {
    next(err);
  }
});

export default router;

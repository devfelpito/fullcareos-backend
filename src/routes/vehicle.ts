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
    const vehicles = await tprisma.vehicle.findMany({});
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const tprisma = tenantPrisma((req as any).tenantId);
    const { clientId, model, plate } = req.body;
    const vehicle = await tprisma.vehicle.create({
      data: { clientId, model, plate }
    });
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
});

export default router;

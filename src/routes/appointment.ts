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
    const appointments = await tprisma.appointment.findMany({});
    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const tprisma = tenantPrisma((req as any).tenantId);
    const { clientId, vehicleId, serviceId, scheduledAt } = req.body;
    const appointment = await tprisma.appointment.create({
      data: { clientId, vehicleId, serviceId, scheduledAt }
    });
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

export default router;

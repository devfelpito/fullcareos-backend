import { Router } from "express";
import { prisma } from "../prisma";
import authMiddleware from "../middleware/auth";
import tenantMiddleware from "../middleware/tenant";
import { validateBody } from "../middleware/validate";
import { createAppointmentSchema } from "../validation/schemas";

const router = Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const appointments = await prisma.appointment.findMany({
      where: { companyId: tenantId },
    });
    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

router.post("/", validateBody(createAppointmentSchema), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { clientId, vehicleId, serviceId, scheduledAt } = req.body;

    const appointment = await prisma.appointment.create({
      data: { clientId, vehicleId, serviceId, scheduledAt, companyId: tenantId },
    });
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
});

export default router;
import { Router } from "express";
import { prisma } from "../prisma";
import authMiddleware from "../middleware/auth";
import tenantMiddleware from "../middleware/tenant";
import { requirePermission } from "../middleware/permission";
import { validateBody } from "../middleware/validate";
import { createVehicleSchema } from "../validation/schemas";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", requirePermission("vehicles:read"), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId: tenantId },
    });
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requirePermission("vehicles:write"),
  validateBody(createVehicleSchema),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const { clientId, model, plate } = req.body;

      const vehicle = await prisma.vehicle.create({
        data: { clientId, model, plate, companyId: tenantId },
      });

      res.status(201).json(vehicle);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
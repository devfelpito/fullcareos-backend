import { Router } from "express";
import { prisma } from "../prisma";
import authMiddleware from "../middleware/auth";
import tenantMiddleware from "../middleware/tenant";
import { requirePermission } from "../middleware/permission";
import { validateBody } from "../middleware/validate";
import { createServiceSchema } from "../validation/schemas";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", requirePermission("services:read"), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const services = await prisma.service.findMany({
      where: { companyId: tenantId },
    });
    res.json(services);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requirePermission("services:write"),
  validateBody(createServiceSchema),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const { name, price, duration } = req.body;

      const service = await prisma.service.create({
        data: { name, price, duration, companyId: tenantId },
      });

      res.status(201).json(service);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
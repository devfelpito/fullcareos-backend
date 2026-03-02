import { Router } from "express";
import { prisma } from "../prisma";
import authMiddleware from "../middleware/auth";
import tenantMiddleware from "../middleware/tenant";
import { requirePermission } from "../middleware/permission";
import { validateBody } from "../middleware/validate";
import { createClientSchema } from "../validation/schemas";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get("/", requirePermission("clients:read"), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const clients = await prisma.client.findMany({
      where: { companyId: tenantId },
    });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  requirePermission("clients:write"),
  validateBody(createClientSchema),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const client = await prisma.client.create({
        data: { ...req.body, companyId: tenantId },
      });
      res.status(201).json(client);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
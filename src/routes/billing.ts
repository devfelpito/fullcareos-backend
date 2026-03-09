import { Router } from "express";
import { prisma } from "../prisma";
import authMiddleware from "../middleware/auth";
import tenantMiddleware from "../middleware/tenant";
import { validateBody } from "../middleware/validate";
import { billingCheckoutSchema } from "../validation/schemas";
import { createCheckoutSession } from "../services/billing";

const router = Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.post("/checkout", validateBody(billingCheckoutSchema), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { plan } = req.body as { plan: "monthly" | "quarterly" | "yearly" };

    const company = await prisma.company.findUnique({ where: { id: tenantId } });
    if (!company) {
      return res.status(404).json({ message: "Empresa não encontrada" });
    }

    const checkout = await createCheckoutSession({
      plan,
      companyId: company.id,
      companyEmail: company.email,
      companyName: company.name,
    });

    await prisma.company.update({
      where: { id: company.id },
      data: { plan: `pending_${plan}` },
    });

    return res.status(201).json({
      message: "Checkout criado com sucesso",
      data: checkout,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/webhook", async (req, res) => {
  return res.status(202).json({
    message: "Webhook recebido",
    received: true,
    payload: req.body,
  });
});

export default router;

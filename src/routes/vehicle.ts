import { Router } from "express";
import { prisma } from "../prisma"; 
import  authMiddleware from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// LISTAR VEÍCULOS
router.get("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const vehicles = await prisma.vehicle.findMany({ where: { companyId } });
  res.json(vehicles);
});

// CRIAR VEÍCULO
router.post("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const { clientId, model, plate } = req.body;

  const vehicle = await prisma.vehicle.create({
    data: { clientId, model, plate, companyId }
  });
  res.json(vehicle);
});

export default router;
module.exports = router;

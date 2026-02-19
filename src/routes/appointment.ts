import { Router } from "express";
import { prisma } from "../prisma"; 
import  authMiddleware from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// LISTAR AGENDAMENTOS
router.get("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const appointments = await prisma.appointment.findMany({ where: { companyId } });
  res.json(appointments);
});

// CRIAR AGENDAMENTO
router.post("/", async (req, res) => {
  const companyId = (req as any).user.companyId;
  const { clientId, vehicleId, serviceId, scheduledAt } = req.body;

  const appointment = await prisma.appointment.create({
    data: { clientId, vehicleId, serviceId, scheduledAt, companyId }
  });
  res.json(appointment);
});

export default router;
module.exports = router;


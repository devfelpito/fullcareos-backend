import { Router } from "express";
import { prisma } from "../prisma";
import customerAuthMiddleware from "../middleware/customerAuth";

const router = Router();

const CATEGORY_LABELS: Record<string, string> = {
  lavagem_polimento: "Lavagem & Polimento",
  protecao_estetica: "Proteção & Estética",
  reparos_rapidos: "Reparos Rápidos",
  geral: "Outros",
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildSlots(date: Date) {
  const slots: string[] = [];
  const start = new Date(date);
  start.setHours(8, 0, 0, 0);

  const end = new Date(date);
  end.setHours(18, 0, 0, 0);

  const current = new Date(start);
  while (current < end) {
    slots.push(current.toISOString());
    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
}

router.use(customerAuthMiddleware);

router.get("/:companySlug/services", async (req, res, next) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const customer = (req as any).customer as { companyId: string };

    const company = await prisma.company.findUnique({ where: { id: customer.companyId } });
    if (!company || company.slug !== companySlug) {
      return res.status(403).json({ message: "Acesso negado para esta empresa" });
    }

    const dateParam = String(req.query.date || toDateKey(new Date()));
    const date = new Date(`${dateParam}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: "Data inválida" });
    }

    const [services, appointments] = await Promise.all([
      prisma.service.findMany({
        where: { companyId: company.id },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
      prisma.appointment.findMany({
        where: {
          companyId: company.id,
          scheduledAt: {
            gte: new Date(`${dateParam}T00:00:00`),
            lt: new Date(`${dateParam}T23:59:59.999`),
          },
        },
        select: { scheduledAt: true },
      }),
    ]);

    const busy = new Set(appointments.map((a) => a.scheduledAt.toISOString()));
    const daySlots = buildSlots(date);

    const grouped: Record<string, any[]> = {};

    for (const service of services) {
      const availableSlots = daySlots.filter((slot) => !busy.has(slot));
      const key = service.category;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        availableSlots,
      });
    }

    const categories = Object.entries(grouped).map(([key, list]) => ({
      key,
      label: CATEGORY_LABELS[key] || CATEGORY_LABELS.geral,
      services: list,
    }));

    return res.status(200).json({
      company: { id: company.id, slug: company.slug, name: company.name },
      date: dateParam,
      categories,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:companySlug/appointments", async (req, res, next) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const customer = (req as any).customer as { companyId: string; clientId: string };
    const serviceId = String(req.body?.serviceId || "");
    const scheduledAtInput = String(req.body?.scheduledAt || "");

    if (!serviceId || !scheduledAtInput) {
      return res.status(400).json({ message: "serviceId e scheduledAt são obrigatórios" });
    }

    const scheduledAt = new Date(scheduledAtInput);
    if (Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ message: "Horário inválido" });
    }

    if (scheduledAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Não é possível agendar no passado" });
    }

    const company = await prisma.company.findUnique({ where: { id: customer.companyId } });
    if (!company || company.slug !== companySlug) {
      return res.status(403).json({ message: "Acesso negado para esta empresa" });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId: company.id },
    });

    if (!service) {
      return res.status(404).json({ message: "Serviço não encontrado" });
    }

    const existing = await prisma.appointment.findFirst({
      where: {
        companyId: company.id,
        scheduledAt,
      },
    });

    if (existing) {
      return res.status(409).json({ message: "Horário indisponível" });
    }

    const appointment = await prisma.appointment.create({
      data: {
        companyId: company.id,
        clientId: customer.clientId,
        serviceId: service.id,
        scheduledAt,
      },
      include: {
        service: { select: { name: true, duration: true, price: true } },
      },
    });

    return res.status(201).json({
      message: "Agendamento confirmado com sucesso",
      appointment,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "Horário indisponível" });
    }
    next(err);
  }
});

router.get("/:companySlug/appointments", async (req, res, next) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const customer = (req as any).customer as { companyId: string; clientId: string };

    const company = await prisma.company.findUnique({ where: { id: customer.companyId } });
    if (!company || company.slug !== companySlug) {
      return res.status(403).json({ message: "Acesso negado para esta empresa" });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        companyId: company.id,
        clientId: customer.clientId,
      },
      include: {
        service: {
          select: { name: true, duration: true, price: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return res.status(200).json(appointments);
  } catch (err) {
    next(err);
  }
});

router.delete("/:companySlug/appointments/:appointmentId", async (req, res, next) => {
  try {
    const companySlug = String(req.params.companySlug || "").trim().toLowerCase();
    const appointmentId = String(req.params.appointmentId || "");
    const customer = (req as any).customer as { companyId: string; clientId: string };

    const company = await prisma.company.findUnique({ where: { id: customer.companyId } });
    if (!company || company.slug !== companySlug) {
      return res.status(403).json({ message: "Acesso negado para esta empresa" });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        companyId: company.id,
        clientId: customer.clientId,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Agendamento não encontrado" });
    }

    await prisma.appointment.delete({ where: { id: appointment.id } });

    return res.status(200).json({ message: "Agendamento cancelado com sucesso" });
  } catch (err) {
    next(err);
  }
});

export default router;

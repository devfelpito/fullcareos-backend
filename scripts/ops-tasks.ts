import fs from "fs";
import path from "path";
import { prisma } from "../src/prisma";

async function main() {
  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [lowActivityCompanies, upcomingAppointments, overdueClients] = await Promise.all([
    prisma.company.findMany({
      where: {
        sales: {
          none: {
            createdAt: { gte: weekAgo },
          },
        },
      },
      select: { id: true, name: true, email: true },
      take: 20,
    }),
    prisma.appointment.findMany({
      where: {
        scheduledAt: {
          gte: today,
          lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        scheduledAt: true,
        client: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),
    prisma.client.findMany({
      where: {
        appointments: {
          none: {
            scheduledAt: { gte: weekAgo },
          },
        },
      },
      select: { id: true, name: true, phone: true, email: true },
      take: 20,
    }),
  ]);

  const lines: string[] = [];
  lines.push(`# Tarefas Operacionais (${date})`);
  lines.push("");
  lines.push("## Empresas sem vendas na semana");
  if (lowActivityCompanies.length === 0) lines.push("- Nenhuma empresa neste cenário.");
  for (const company of lowActivityCompanies) {
    lines.push(`- [ ] Contatar ${company.name} (${company.email}) para recuperar pipeline.`);
  }

  lines.push("");
  lines.push("## Agendamentos para confirmação (48h)");
  if (upcomingAppointments.length === 0) lines.push("- Nenhum agendamento para confirmar.");
  for (const appointment of upcomingAppointments) {
    lines.push(`- [ ] Confirmar ${appointment.client.name} para ${appointment.scheduledAt.toISOString()}.`);
  }

  lines.push("");
  lines.push("## Clientes sem atividade recente");
  if (overdueClients.length === 0) lines.push("- Sem clientes inativos no corte atual.");
  for (const client of overdueClients) {
    const contact = client.phone || client.email || "sem contato";
    lines.push(`- [ ] Reengajar cliente ${client.name} (${contact}).`);
  }

  const outputDir = path.resolve(process.cwd(), "reports");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `ops-tasks-${date}.md`);
  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");

  console.log(`Checklist gerado em: ${outputPath}`);
}

main()
  .catch((err) => {
    console.error("Falha ao gerar checklist:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

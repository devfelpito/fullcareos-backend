import fs from "fs";
import path from "path";
import { prisma } from "../src/prisma";

async function main() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  const [
    companies,
    activeUsers,
    clients,
    appointments,
    salesAggregate,
    expensesAggregate,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count({ where: { active: true } }),
    prisma.client.count(),
    prisma.appointment.count({ where: { scheduledAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
    prisma.sale.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  const sales = salesAggregate._sum.amount || 0;
  const expenses = expensesAggregate._sum.amount || 0;
  const grossMargin = sales - expenses;

  const report = `# Relatorio KPI Diario (${date})\n\n` +
    `## Operacao\n` +
    `- Empresas ativas: ${companies}\n` +
    `- Usuarios ativos: ${activeUsers}\n` +
    `- Clientes cadastrados: ${clients}\n` +
    `- Agendamentos no mes: ${appointments}\n\n` +
    `## Financeiro\n` +
    `- Vendas acumuladas: R$ ${sales.toFixed(2)}\n` +
    `- Despesas acumuladas: R$ ${expenses.toFixed(2)}\n` +
    `- Margem bruta: R$ ${grossMargin.toFixed(2)}\n\n` +
    `## Acoes recomendadas\n` +
    `1. Revisar empresas sem vendas na ultima semana.\n` +
    `2. Acionar clientes inativos ha mais de 30 dias.\n` +
    `3. Verificar despesas fora do padrao.\n`;

  const outputDir = path.resolve(process.cwd(), "reports");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `daily-kpi-${date}.md`);
  fs.writeFileSync(outputPath, report, "utf8");

  console.log(`Relatorio gerado em: ${outputPath}`);
}

main()
  .catch((err) => {
    console.error("Falha ao gerar relatorio:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

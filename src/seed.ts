import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do FullcareOS...");

  // Criar Empresa
  const company = await prisma.company.create({
    data: {
      name: "FullcareOS Teste",
      cnpj: "00.000.000/0000-00",
      email: "contato@fullcareos.com",
      phone: "11999999999",
      address: "Rua Teste, 123, São Paulo, SP",
      plan: "trial",
      trialEndsAt: new Date(new Date().setDate(new Date().getDate() + 14)),
    },
  });

  console.log("Empresa criada:", company.name);

  // Criar Cargos padrão
  const roles = [
    { name: "Admin", description: "Acesso total ao sistema" },
    { name: "Gerente", description: "Gerencia agendamentos e finanças" },
    { name: "Operador", description: "Acesso apenas a agenda e clientes" },
  ];

  const createdRoles: any[] = [];

  for (const roleData of roles) {
    const role = await prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        companyId: company.id,
      },
    });
    createdRoles.push(role);
  }

  console.log("Cargos criados:", createdRoles.map((r) => r.name).join(", "));

  // Criar Admin padrão (idempotente com upsert)
  const passwordHash = await bcrypt.hash("Fullcare123", 10);
  const adminRoleId = createdRoles.find((r) => r.name === "Admin")!.id;

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@fullcareos.com" },
    update: {
      name: "Administrador FullcareOS",
      password: passwordHash,
      active: true,
      companyId: company.id,
      roleId: adminRoleId,
    },
    create: {
      name: "Administrador FullcareOS",
      email: "admin@fullcareos.com",
      password: passwordHash,
      active: true,
      companyId: company.id,
      roleId: adminRoleId,
    },
  });

  console.log("Usuário Admin criado/atualizado:", adminUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Seed finalizado!");
  });
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Iniciando seed do FullcareOS...");
    // Criar Empresa
    const company = await prisma.company.create({
        data: {
            name: "FullcareOS Teste",
            cnpj: "00.000.000/0000-00",
            email: "contato@fullcareos.com",
            phone: "11999999999",
            address: "Rua Teste, 123, SÃ£o Paulo, SP",
            plan: "trial",
            trialEndsAt: new Date(new Date().setDate(new Date().getDate() + 14)),
        },
    });
    console.log("Empresa criada:", company.name);
    // Criar Cargos padrÃ£o
    const roles = [
        { name: "Admin", description: "Acesso total ao sistema" },
        { name: "Gerente", description: "Gerencia agendamentos e finanÃ§as" },
        { name: "Operador", description: "Acesso apenas a agenda e clientes" },
    ];
    const createdRoles = [];
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
    // PermissÃµes RBAC (read/write por mÃ³dulo)
    const permissionNames = [
        "clients:read",
        "clients:write",
        "vehicles:read",
        "vehicles:write",
        "services:read",
        "services:write",
        "appointments:read",
        "appointments:write",
        "sales:read",
        "sales:write",
        "expenses:read",
        "expenses:write",
    ];
    const permissions = [];
    for (const name of permissionNames) {
        const permission = await prisma.permission.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        permissions.push(permission);
    }
    // Criar Admin padrÃ£o (idempotente com upsert)
    const passwordHash = await bcrypt_1.default.hash("Fullcare123", 10);
    const adminRoleId = createdRoles.find((r) => r.name === "Admin").id;
    const adminUser = await prisma.user.upsert({
        where: { email: "admin@fullcareos.com" },
        update: {
            name: "Administrador FullcareOS",
            password: passwordHash,
            active: true,
            emailVerifiedAt: new Date(),
            companyId: company.id,
            roleId: adminRoleId,
        },
        create: {
            name: "Administrador FullcareOS",
            email: "admin@fullcareos.com",
            password: passwordHash,
            active: true,
            emailVerifiedAt: new Date(),
            companyId: company.id,
            roleId: adminRoleId,
        },
    });
    // Vincular todas permissÃµes ao cargo Admin (idempotente)
    for (const permission of permissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRoleId,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: adminRoleId,
                permissionId: permission.id,
            },
        });
    }
    console.log("UsuÃ¡rio Admin criado/atualizado:", adminUser.email);
    console.log("PermissÃµes RBAC aplicadas ao Admin:", permissionNames.join(", "));
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

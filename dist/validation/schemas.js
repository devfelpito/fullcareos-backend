"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpenseSchema = exports.createSaleSchema = exports.createAppointmentSchema = exports.createServiceSchema = exports.createVehicleSchema = exports.createClientSchema = exports.customerResetPasswordSchema = exports.customerForgotPasswordSchema = exports.customerVerifyEmailSchema = exports.customerLoginSchema = exports.customerRegisterSchema = exports.billingCheckoutSchema = exports.onboardingSchema = exports.authResetPasswordSchema = exports.authForgotPasswordSchema = exports.authVerifyEmailSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z
    .object({
    email: zod_1.z.string().email("E-mail inválido"),
    password: zod_1.z.string().min(1, "Senha é obrigatória"),
})
    .strict();
exports.authVerifyEmailSchema = zod_1.z
    .object({
    email: zod_1.z.string().email("E-mail inválido"),
    token: zod_1.z.string().min(10, "Token inválido"),
})
    .strict();
exports.authForgotPasswordSchema = zod_1.z
    .object({
    email: zod_1.z.string().email("E-mail inválido"),
})
    .strict();
exports.authResetPasswordSchema = zod_1.z
    .object({
    email: zod_1.z.string().email("E-mail inválido"),
    token: zod_1.z.string().min(10, "Token inválido"),
    newPassword: zod_1.z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres"),
})
    .strict();
exports.onboardingSchema = zod_1.z
    .object({
    companyName: zod_1.z.string().min(2, "Nome da empresa é obrigatório"),
    companySlug: zod_1.z.string().min(3).max(50).optional(),
    companyEmail: zod_1.z.string().email("E-mail da empresa inválido"),
    phone: zod_1.z.string().min(8, "Telefone é obrigatório"),
    address: zod_1.z.string().min(5, "Endereço é obrigatório"),
    adminName: zod_1.z.string().min(2, "Nome do administrador é obrigatório"),
    adminEmail: zod_1.z.string().email("E-mail do administrador inválido"),
    adminPassword: zod_1.z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
})
    .strict();
exports.billingCheckoutSchema = zod_1.z
    .object({
    plan: zod_1.z.enum(["monthly", "quarterly", "yearly"]),
})
    .strict();
exports.customerRegisterSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Nome é obrigatório"),
    email: zod_1.z.string().email("E-mail inválido"),
    phone: zod_1.z.string().min(8, "Telefone é obrigatório"),
    password: zod_1.z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
})
    .strict();
exports.customerLoginSchema = zod_1.z
    .object({
    email: zod_1.z.string().email("E-mail inválido"),
    password: zod_1.z.string().min(1, "Senha é obrigatória"),
})
    .strict();
exports.customerVerifyEmailSchema = zod_1.z
    .object({
    email: zod_1.z.string().email("E-mail inválido"),
    token: zod_1.z.string().min(10, "Token inválido"),
})
    .strict();
exports.customerForgotPasswordSchema = zod_1.z
    .object({
    email: zod_1.z.string().email("E-mail inválido"),
})
    .strict();
exports.customerResetPasswordSchema = zod_1.z
    .object({
    email: zod_1.z.string().email("E-mail inválido"),
    token: zod_1.z.string().min(10, "Token inválido"),
    newPassword: zod_1.z.string().min(8, "Nova senha deve ter no mínimo 8 caracteres"),
})
    .strict();
exports.createClientSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1, "Nome é obrigatório"),
    email: zod_1.z.string().email("E-mail inválido").optional(),
    phone: zod_1.z.string().min(1).optional(),
})
    .strict();
exports.createVehicleSchema = zod_1.z
    .object({
    clientId: zod_1.z.string().uuid("clientId inválido"),
    model: zod_1.z.string().min(1, "Modelo é obrigatório"),
    plate: zod_1.z.string().min(1, "Placa é obrigatória"),
})
    .strict();
exports.createServiceSchema = zod_1.z
    .object({
    category: zod_1.z
        .enum(["lavagem_polimento", "protecao_estetica", "reparos_rapidos", "geral"])
        .optional(),
    name: zod_1.z.string().min(1, "Nome é obrigatório"),
    price: zod_1.z.number().positive("Preço deve ser maior que zero"),
    duration: zod_1.z.number().int().positive("Duração deve ser um inteiro positivo"),
})
    .strict();
exports.createAppointmentSchema = zod_1.z
    .object({
    clientId: zod_1.z.string().uuid("clientId inválido"),
    vehicleId: zod_1.z.string().uuid("vehicleId inválido").optional().nullable(),
    serviceId: zod_1.z.string().uuid("serviceId inválido"),
    scheduledAt: zod_1.z.coerce.date(),
})
    .strict();
exports.createSaleSchema = zod_1.z
    .object({
    clientId: zod_1.z.string().uuid("clientId inválido"),
    serviceId: zod_1.z.string().uuid("serviceId inválido"),
    amount: zod_1.z.number().positive("Valor deve ser maior que zero"),
    paymentMethod: zod_1.z.string().min(1, "Método de pagamento é obrigatório"),
})
    .strict();
exports.createExpenseSchema = zod_1.z
    .object({
    description: zod_1.z.string().min(1, "Descrição é obrigatória"),
    amount: zod_1.z.number().positive("Valor deve ser maior que zero"),
})
    .strict();

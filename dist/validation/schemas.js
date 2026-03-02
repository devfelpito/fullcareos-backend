"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpenseSchema = exports.createSaleSchema = exports.createAppointmentSchema = exports.createServiceSchema = exports.createVehicleSchema = exports.createClientSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z
    .object({
    email: zod_1.z.string().email("E-mail inválido"),
    password: zod_1.z.string().min(1, "Senha é obrigatória"),
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

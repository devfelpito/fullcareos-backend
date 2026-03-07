import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().email("E-mail inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
  })
  .strict();

export const onboardingSchema = z
  .object({
    companyName: z.string().min(2, "Nome da empresa é obrigatório"),
    companyEmail: z.string().email("E-mail da empresa inválido"),
    phone: z.string().min(8, "Telefone é obrigatório"),
    address: z.string().min(5, "Endereço é obrigatório"),
    adminName: z.string().min(2, "Nome do administrador é obrigatório"),
    adminEmail: z.string().email("E-mail do administrador inválido"),
    adminPassword: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  })
  .strict();

export const billingCheckoutSchema = z
  .object({
    plan: z.enum(["monthly", "quarterly", "yearly"]),
  })
  .strict();

export const createClientSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("E-mail inválido").optional(),
    phone: z.string().min(1).optional(),
  })
  .strict();

export const createVehicleSchema = z
  .object({
    clientId: z.string().uuid("clientId inválido"),
    model: z.string().min(1, "Modelo é obrigatório"),
    plate: z.string().min(1, "Placa é obrigatória"),
  })
  .strict();

export const createServiceSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    price: z.number().positive("Preço deve ser maior que zero"),
    duration: z.number().int().positive("Duração deve ser um inteiro positivo"),
  })
  .strict();

export const createAppointmentSchema = z
  .object({
    clientId: z.string().uuid("clientId inválido"),
    vehicleId: z.string().uuid("vehicleId inválido").optional().nullable(),
    serviceId: z.string().uuid("serviceId inválido"),
    scheduledAt: z.coerce.date(),
  })
  .strict();

export const createSaleSchema = z
  .object({
    clientId: z.string().uuid("clientId inválido"),
    serviceId: z.string().uuid("serviceId inválido"),
    amount: z.number().positive("Valor deve ser maior que zero"),
    paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  })
  .strict();

export const createExpenseSchema = z
  .object({
    description: z.string().min(1, "Descrição é obrigatória"),
    amount: z.number().positive("Valor deve ser maior que zero"),
  })
  .strict();

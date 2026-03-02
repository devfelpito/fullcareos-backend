"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = __importDefault(require("../middleware/auth"));
const tenant_1 = __importDefault(require("../middleware/tenant"));
const permission_1 = require("../middleware/permission");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.use(tenant_1.default);
router.get("/", (0, permission_1.requirePermission)("appointments:read"), async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const appointments = await prisma_1.prisma.appointment.findMany({
            where: { companyId: tenantId },
        });
        res.json(appointments);
    }
    catch (err) {
        next(err);
    }
});
router.post("/", (0, permission_1.requirePermission)("appointments:write"), (0, validate_1.validateBody)(schemas_1.createAppointmentSchema), async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const { clientId, vehicleId, serviceId, scheduledAt } = req.body;
        const appointment = await prisma_1.prisma.appointment.create({
            data: { clientId, vehicleId, serviceId, scheduledAt, companyId: tenantId },
        });
        res.status(201).json(appointment);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

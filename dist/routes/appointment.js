"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const tenant_1 = __importDefault(require("../middleware/tenant"));
const tenantPrisma_1 = require("../utils/tenantPrisma");
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.use(tenant_1.default);
router.get("/", async (req, res, next) => {
    try {
        const tprisma = (0, tenantPrisma_1.tenantPrisma)(req.tenantId);
        const appointments = await tprisma.appointment.findMany({});
        res.json(appointments);
    }
    catch (err) {
        next(err);
    }
});
router.post("/", async (req, res, next) => {
    try {
        const tprisma = (0, tenantPrisma_1.tenantPrisma)(req.tenantId);
        const { clientId, vehicleId, serviceId, scheduledAt } = req.body;
        const appointment = await tprisma.appointment.create({
            data: { clientId, vehicleId, serviceId, scheduledAt }
        });
        res.json(appointment);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

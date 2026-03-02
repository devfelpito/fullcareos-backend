"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = __importDefault(require("../middleware/auth"));
const tenant_1 = __importDefault(require("../middleware/tenant"));
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.use(tenant_1.default);
router.get("/", async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const services = await prisma_1.prisma.service.findMany({
            where: { companyId: tenantId },
        });
        res.json(services);
    }
    catch (err) {
        next(err);
    }
});
router.post("/", (0, validate_1.validateBody)(schemas_1.createServiceSchema), async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const { name, price, duration } = req.body;
        const service = await prisma_1.prisma.service.create({
            data: { name, price, duration, companyId: tenantId },
        });
        res.status(201).json(service);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

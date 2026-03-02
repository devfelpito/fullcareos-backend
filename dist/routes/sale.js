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
router.get("/", (0, permission_1.requirePermission)("sales:read"), async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const sales = await prisma_1.prisma.sale.findMany({
            where: { companyId: tenantId },
        });
        res.json(sales);
    }
    catch (err) {
        next(err);
    }
});
router.post("/", (0, permission_1.requirePermission)("sales:write"), (0, validate_1.validateBody)(schemas_1.createSaleSchema), async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const { clientId, serviceId, amount, paymentMethod } = req.body;
        const sale = await prisma_1.prisma.sale.create({
            data: { clientId, serviceId, amount, paymentMethod, companyId: tenantId },
        });
        res.status(201).json(sale);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

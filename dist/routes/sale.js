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
        const sales = await tprisma.sale.findMany({});
        res.json(sales);
    }
    catch (err) {
        next(err);
    }
});
router.post("/", async (req, res, next) => {
    try {
        const tprisma = (0, tenantPrisma_1.tenantPrisma)(req.tenantId);
        const { clientId, serviceId, amount, paymentMethod } = req.body;
        const sale = await tprisma.sale.create({
            data: { clientId, serviceId, amount, paymentMethod }
        });
        res.json(sale);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

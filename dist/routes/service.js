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
router.get("/", (0, permission_1.requirePermission)("services:read"), async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const services = await prisma_1.prisma.service.findMany({
            where: { companyId: tenantId },
            orderBy: [{ category: "asc" }, { name: "asc" }],
        });
        res.json(services);
    }
    catch (err) {
        next(err);
    }
});
router.post("/", (0, permission_1.requirePermission)("services:write"), (0, validate_1.validateBody)(schemas_1.createServiceSchema), async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        const { category, name, price, duration } = req.body;
        const service = await prisma_1.prisma.service.create({
            data: { category: category || "geral", name, price, duration, companyId: tenantId },
        });
        res.status(201).json(service);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

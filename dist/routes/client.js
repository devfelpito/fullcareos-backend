"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// filepath: c:\Users\danie\fullcareos\backend\src\routes\client.ts
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const tenant_1 = __importDefault(require("../middleware/tenant"));
const tenantPrisma_1 = require("../utils/tenantPrisma");
const router = express_1.default.Router();
// aplica tenantMiddleware para todas as rotas deste router
router.use(auth_1.default);
router.use(tenant_1.default);
// listar clientes do tenant
router.get("/", async (req, res, next) => {
    try {
        const tprisma = (0, tenantPrisma_1.tenantPrisma)(req.tenantId);
        const clients = await tprisma.client.findMany({});
        res.json(clients);
    }
    catch (err) {
        next(err);
    }
});
// criar cliente (companyId injetado automaticamente)
router.post("/", async (req, res, next) => {
    try {
        const tprisma = (0, tenantPrisma_1.tenantPrisma)(req.tenantId);
        const data = req.body;
        const client = await tprisma.client.create({ data });
        res.status(201).json(client);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

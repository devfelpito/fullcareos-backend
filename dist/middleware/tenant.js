"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = tenantMiddleware;
const prisma_1 = require("../prisma");
async function tenantMiddleware(req, res, next) {
    try {
        const user = req.user;
        const companyId = user?.companyId;
        if (!companyId) {
            return res.status(401).json({ message: "Tenant não informado" });
        }
        const company = await prisma_1.prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({ message: "Empresa não encontrada" });
        }
        req.tenantId = companyId;
        next();
    }
    catch (err) {
        next(err);
    }
}

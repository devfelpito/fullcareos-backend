"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = tenantMiddleware;
const prisma_1 = require("../prisma");
async function tenantMiddleware(req, res, next) {
    const user = req.user;
    if (!user || !user.companyId)
        return res.status(401).json({ message: "Tenant não informado" });
    try {
        const company = await prisma_1.prisma.company.findUnique({ where: { id: user.companyId } });
        if (!company)
            return res.status(404).json({ message: "Empresa não encontrada" });
        req.tenantId = user.companyId;
        next();
    }
    catch (err) {
        next(err);
    }
}

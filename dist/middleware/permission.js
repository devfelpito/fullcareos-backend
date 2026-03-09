"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const prisma_1 = require("../prisma");
function requirePermission(permissionName) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            const tenantId = req.tenantId;
            if (!user?.roleId || !tenantId) {
                return res.status(401).json({ message: "Usuário não autenticado" });
            }
            const rolePermission = await prisma_1.prisma.rolePermission.findFirst({
                where: {
                    roleId: user.roleId,
                    role: { companyId: tenantId },
                    permission: { name: permissionName },
                },
            });
            if (!rolePermission) {
                return res.status(403).json({ message: "Acesso negado" });
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
}

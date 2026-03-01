"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantPrisma = tenantPrisma;
// filepath: c:\Users\danie\fullcareos\backend\src\utils\tenantPrisma.ts
const prisma_1 = require("../prisma");
function tenantPrisma(companyId) {
    const handler = {
        get(target, prop) {
            const name = String(prop);
            const orig = target[prop];
            if (typeof orig !== "function")
                return orig;
            return (...args) => {
                const params = args[0] ?? {};
                if (/^(find|count|aggregate|groupBy)/.test(name)) {
                    params.where = { ...(params.where ?? {}), companyId };
                    return orig.call(target, params);
                }
                if (name === "create") {
                    params.data = { ...(params.data ?? {}), companyId };
                    return orig.call(target, params);
                }
                if (["update", "delete", "upsert", "updateMany", "deleteMany"].includes(name)) {
                    params.where = { ...(params.where ?? {}), companyId };
                    return orig.call(target, params);
                }
                return orig.apply(target, args);
            };
        },
    };
    return new Proxy(prisma_1.prisma, handler);
}

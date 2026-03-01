 // filepath: c:\Users\danie\fullcareos\backend\src\utils\tenantPrisma.ts
import { prisma as basePrisma } from "../prisma";

type AnyFn = (...args: any[]) => any;

export function tenantPrisma(companyId: string) {
  const handler: ProxyHandler<any> = {
    get(target, prop: string | symbol) {
      const name = String(prop);
      const orig = (target as any)[prop];
      if (typeof orig !== "function") return orig;

      return (...args: any[]) => {
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

  return new Proxy(basePrisma, handler);
}

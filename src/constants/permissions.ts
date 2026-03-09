export const SYSTEM_PERMISSIONS = [
  "clients:read",
  "clients:write",
  "vehicles:read",
  "vehicles:write",
  "services:read",
  "services:write",
  "appointments:read",
  "appointments:write",
  "sales:read",
  "sales:write",
  "expenses:read",
  "expenses:write",
] as const;

export type SystemPermission = (typeof SYSTEM_PERMISSIONS)[number];

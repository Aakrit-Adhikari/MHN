import type { PermissionKey, User } from "@/types/api";

export const modulePermissions: Record<string, PermissionKey> = {
  "/dashboard": "VIEW_DASHBOARD",
  "/bookings": "VIEW_BOOKINGS",
  "/calendar": "VIEW_BOOKINGS",
  "/tours": "VIEW_TOURS",
  "/blogs": "VIEW_BLOGS",
  "/newsletters": "VIEW_NEWSLETTERS",
  "/inquiries": "VIEW_INQUIRIES",
  "/customers": "VIEW_CUSTOMERS",
  "/sources": "VIEW_DASHBOARD",
  "/finance": "VIEW_FINANCE",
  "/reports": "VIEW_REPORTS",
  "/navigation": "VIEW_NAVIGATION",
  "/settings": "VIEW_SETTINGS",
  "/users": "VIEW_USERS"
};

export const moduleRoleRequirements: Record<string, User["role"]> = {
  "/alert-popup": "SUPER_ADMIN"
};

export function isSuperAdmin(user: User | null | undefined) {
  return user?.role === "SUPER_ADMIN";
}

export function hasPermission(user: User | null | undefined, permission: PermissionKey) {
  return user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || Boolean(user?.permissions?.includes(permission));
}

export function permissionForPath(pathname: string) {
  const entry = Object.entries(modulePermissions).find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return entry?.[1] ?? null;
}

export function roleRequiredForPath(pathname: string) {
  const entry = Object.entries(moduleRoleRequirements).find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return entry?.[1] ?? null;
}

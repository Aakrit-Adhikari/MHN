import type { PermissionKey, User } from "@/types/api";

export const modulePermissions: Record<string, PermissionKey> = {
  "/dashboard": "VIEW_DASHBOARD",
  "/bookings": "VIEW_BOOKINGS",
  "/tours": "VIEW_TOURS",
  "/blogs": "VIEW_BLOGS",
  "/inquiries": "VIEW_INQUIRIES",
  "/customers": "VIEW_CUSTOMERS",
  "/finance": "VIEW_FINANCE",
  "/reports": "VIEW_REPORTS",
  "/navigation": "VIEW_NAVIGATION",
  "/settings": "VIEW_SETTINGS",
  "/users": "VIEW_USERS"
};

export function isSuperAdmin(user: User | null | undefined) {
  return user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
}

export function hasPermission(user: User | null | undefined, permission: PermissionKey) {
  return isSuperAdmin(user) || Boolean(user?.permissions?.includes(permission));
}

export function permissionForPath(pathname: string) {
  const entry = Object.entries(modulePermissions).find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return entry?.[1] ?? null;
}

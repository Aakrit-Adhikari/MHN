import { z } from "zod";
import { allPermissionKeys } from "../config/permissions.js";

export const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export const impersonateAdminSchema = z.object({
    userId: z.string().min(1, "User is required"),
});

export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'HR', 'OPERATIONS', 'EMPLOYEE', 'CUSTOMER']);
export const UserStatusSchema = z.enum(['ACTIVE', 'DISABLED']);
export const PermissionKeySchema = z.enum(allPermissionKeys);

export const createAdminUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1).max(100).nullable().optional(),
    role: UserRoleSchema,
    status: UserStatusSchema.default('ACTIVE'),
    permissions: z.array(PermissionKeySchema).default([]),
});

export const updateAdminUserSchema = z.object({
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(6).optional(),
    name: z.string().min(1).max(100).nullable().optional(),
    role: UserRoleSchema.optional(),
    status: UserStatusSchema.optional(),
    permissions: z.array(PermissionKeySchema).optional(),
});

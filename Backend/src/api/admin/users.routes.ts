import bcrypt from "bcryptjs";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import {
    authenticate,
    requirePermission,
    type AuthenticatedRequest,
} from "../../middleware/auth.middleware.js";
import { createAdminUserSchema, updateAdminUserSchema } from "../../types/auth.schema.js";

const router = Router();

const userInclude = {
    userPermissions: { include: { permission: true } },
};

function serializeUser(user: {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    userPermissions: { permission: { key: string } }[];
}) {
    return {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions: user.userPermissions.map((item) => item.permission.key).sort(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

async function getPermissionIds(keys: string[]) {
    const uniqueKeys = [...new Set(keys)];
    const permissions = await prisma.permission.findMany({
        where: { key: { in: uniqueKeys } },
        select: { id: true, key: true },
    });

    if (permissions.length !== uniqueKeys.length) {
        const found = new Set(permissions.map((permission) => permission.key));
        const missing = uniqueKeys.filter((key) => !found.has(key));
        throw new Error(`Unknown permissions: ${missing.join(", ")}`);
    }

    return permissions.map((permission) => permission.id);
}

router.use(authenticate, requirePermission("VIEW_USERS"));

router.get("/", async (_req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            include: userInclude,
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({
            success: true,
            data: users.map(serializeUser),
        });
    } catch (error) {
        next(error);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const data = createAdminUserSchema.parse(req.body);
        const permissionIds = await getPermissionIds(data.permissions);
        const passwordHash = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                username: data.username,
                name: data.name ?? null,
                email: null,
                passwordHash,
                role: data.role,
                status: data.status,
                userPermissions: {
                    create: permissionIds.map((permissionId) => ({
                        permissionId,
                    })),
                },
            },
            include: userInclude,
        });

        res.status(201).json({ success: true, data: serializeUser(user) });
    } catch (error) {
        if (error instanceof Error && error.message.startsWith("Unknown permissions:")) {
            res.status(400).json({ success: false, message: error.message });
            return;
        }

        next(error);
    }
});

router.patch("/:id", async (req: AuthenticatedRequest, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const data = updateAdminUserSchema.parse(req.body);
        const permissionIds = data.permissions ? await getPermissionIds(data.permissions) : null;
        const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined;

        if (req.user?.id === id && data.status === "DISABLED") {
            res.status(400).json({
                success: false,
                message: "You cannot disable your own account.",
            });
            return;
        }

        const user = await prisma.$transaction(async (tx) => {
            if (permissionIds) {
                await tx.userPermission.deleteMany({ where: { userId: id } });
            }

            return tx.user.update({
                where: { id },
                data: {
                    username: data.username,
                    name: data.name,
                    role: data.role,
                    status: data.status,
                    ...(passwordHash ? { passwordHash } : {}),
                    ...(permissionIds
                        ? {
                            userPermissions: {
                                create: permissionIds.map((permissionId) => ({ permissionId })),
                            },
                        }
                        : {}),
                },
                include: userInclude,
            });
        });

        res.status(200).json({ success: true, data: serializeUser(user) });
    } catch (error) {
        if (error instanceof Error && error.message.startsWith("Unknown permissions:")) {
            res.status(400).json({ success: false, message: error.message });
            return;
        }

        next(error);
    }
});

router.delete("/:id", async (req: AuthenticatedRequest, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        if (req.user?.id === id) {
            res.status(400).json({
                success: false,
                message: "You cannot delete your own account.",
            });
            return;
        }

        await prisma.user.delete({ where: { id } });

        res.status(200).json({
            success: true,
            message: "Admin user deleted successfully",
        });
    } catch (error) {
        next(error);
    }
});

export default router;

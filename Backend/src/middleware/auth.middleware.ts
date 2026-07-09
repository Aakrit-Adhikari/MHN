import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { PermissionKey } from "../config/permissions.js";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";

export type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        username: string;
        name: string | null;
        role: string;
        status: string;
        permissions: PermissionKey[];
    };
};

type TokenPayload = {
    sub: string;
    role: string;
};

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            message: "Authentication token is required",
        });
        return;
    }

    try {
        const token = authorization.slice("Bearer ".length);
        const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;

        if (!payload.sub || !payload.role) {
            throw new Error("Invalid token payload");
        }

        void prisma.user.findUnique({
            where: { id: payload.sub },
            include: { userPermissions: { include: { permission: true } } },
        }).then((user) => {
            if (!user || user.status !== 'ACTIVE') {
                res.status(401).json({
                    success: false,
                    message: "Invalid or expired authentication token",
                });
                return;
            }

            req.user = {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                status: user.status,
                permissions: user.userPermissions.map((item) => item.permission.key as PermissionKey),
            };

            next();
        }).catch(() => {
            res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token",
            });
        });
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token",
        });
    }
};

export const requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== "ADMIN" && req.user?.role !== "SUPER_ADMIN") {
        res.status(403).json({
            success: false,
            message: "Admin access is required",
        });
        return;
    }

    next();
};

export const requireSuperAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role !== "SUPER_ADMIN") {
        res.status(403).json({
            success: false,
            message: "Super admin access is required",
        });
        return;
    }

    next();
};

export const requirePermission = (permission: PermissionKey) => (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN') {
        next();
        return;
    }

    if (!req.user?.permissions.includes(permission)) {
        res.status(403).json({
            success: false,
            message: "Access denied",
        });
        return;
    }

    next();
};

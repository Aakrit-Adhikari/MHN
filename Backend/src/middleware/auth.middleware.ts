import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        role: string;
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

        req.user = {
            id: payload.sub,
            role: payload.role,
        };

        next();




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
    if (req.user?.role !== "ADMIN") {
        res.status(403).json({
            success: false,
            message: "Admin access is required",
        });
        return;
    }

    next();
};


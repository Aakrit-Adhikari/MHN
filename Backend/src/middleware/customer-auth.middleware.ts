import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";

export type CustomerAuthenticatedRequest = Request & {
    customer?: {
        id: string;
        name: string;
        email: string;
        category: string;
        totalBookings: number;
        totalSpent: number;
    };
};

type CustomerTokenPayload = {
    sub: string;
    type: "CUSTOMER";
};

export const authenticateCustomer = async (
    req: CustomerAuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Customer login is required" });
        return;
    }

    try {
        const token = authorization.slice("Bearer ".length);
        const payload = jwt.verify(token, env.jwtSecret) as CustomerTokenPayload;

        if (!payload.sub || payload.type !== "CUSTOMER") {
            throw new Error("Invalid customer token");
        }

        const customer = await prisma.customerAccount.findUnique({
            where: { id: payload.sub },
        });

        if (!customer) {
            res.status(401).json({ success: false, message: "Invalid or expired customer session" });
            return;
        }

        req.customer = {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            category: customer.category,
            totalBookings: customer.totalBookings,
            totalSpent: customer.totalSpent,
        };

        next();
    } catch {
        res.status(401).json({ success: false, message: "Invalid or expired customer session" });
    }
};

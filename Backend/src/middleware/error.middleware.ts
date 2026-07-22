import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
    const statusCode = error.statusCode || 500;
    const isPrismaError =
        error instanceof Prisma.PrismaClientKnownRequestError ||
        error instanceof Prisma.PrismaClientValidationError ||
        error instanceof Prisma.PrismaClientInitializationError;
    const message = isPrismaError
        ? "Database operation failed. Please check that the database schema is up to date."
        : error.message || "Internal server error";

    res.status(statusCode).json({
        success: false,
        message,
        stack: env.nodeEnv === "development" ? error.stack : undefined,
    });
};

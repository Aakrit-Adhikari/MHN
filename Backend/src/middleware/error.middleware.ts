import type { ErrorRequestHandler } from "express";
import { env } from "../config/env";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error",
        stack: env.nodeEnv === "development" ? error.stack : undefined,
    });
};
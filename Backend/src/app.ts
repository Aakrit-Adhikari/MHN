import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import healthRoutes from "./api/health/health.routes.js";
import authRoutes from "./api/auth/auth.routes.js";
import adminAuthRoutes from "./api/admin/auth.routes.js";
import adminDashboardRoutes from "./api/admin/dashboard.routes.js";
import adminBookingRoutes from "./api/admin/bookings.routes.js";
import adminPermissionRoutes from "./api/admin/permissions.routes.js";
import adminUserRoutes from "./api/admin/users.routes.js";
import { adminBlogRouter, publicBlogRouter } from "./api/blogs/blog.routes.js";
import inquiryRoutes from "./api/inquiries/inquiries.routes.js";
import navigationRoutes from "./api/navigation/navigation.routes.js";
import tourRoutes from "./api/tours/tour.routes.js";
import swaggerRoutes from "./docs/swagger.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
    })
);
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(backendRoot, "uploads")));
app.use(swaggerRoutes);

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/navigation", navigationRoutes);
app.use("/api/blogs", publicBlogRouter);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/permissions", adminPermissionRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/blogs", adminBlogRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

app.use(errorMiddleware);

export default app;

import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./api/health/health.routes.js";
import authRoutes from "./api/auth/auth.routes.js";
import { adminBlogRouter, publicBlogRouter } from "./api/blogs/blog.routes.js";
import inquiryRoutes from "./api/inquiries/inquiries.routes.js";
import tourRoutes from "./api/tours/tour.routes.js";
import { admin } from "./admin/admin.js";
import { adminRouter } from "./admin/admin.router.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
    })
);
app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/blogs", publicBlogRouter);
app.use("/api/admin/blogs", adminBlogRouter);
app.use(admin.options.rootPath, adminRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

app.use(errorMiddleware);

export default app;

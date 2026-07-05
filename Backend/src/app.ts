import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./api/health/health.routes";
import authRoutes from "./api/auth/auth.routes";
import { adminBlogRouter, publicBlogRouter } from "./api/blogs/blog.routes";
import inquiryRoutes from "./api/inquiries/inquiries.routes";
import tourRoutes from "./api/tours/tour.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/blogs", publicBlogRouter);
app.use("/api/admin/blogs", adminBlogRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

app.use(errorMiddleware);

export default app;

import express from "express";
import cors from "cors";
import helmet from "helmet";
import healthRoutes from "./api/health/health.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

export default app;
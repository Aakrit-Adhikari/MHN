import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Mountain Helicopters backend is healthy",
        timestamp: new Date().toISOString(),
    });
});

export default router;

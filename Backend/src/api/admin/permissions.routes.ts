import { Router } from "express";
import { prisma } from "../../config/database.js";
import { permissions as configuredPermissions } from "../../config/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, requirePermission("VIEW_USERS"), async (_req, res, next) => {
    try {
        const permissions = await prisma.permission.findMany({
            orderBy: { name: "asc" },
        });

        res.status(200).json({
            success: true,
            data: permissions.length ? permissions : configuredPermissions,
        });
    } catch (error) {
        next(error);
    }
});

export default router;

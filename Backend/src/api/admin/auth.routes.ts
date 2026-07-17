import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import {
    authenticate,
    requireSuperAdmin,
    type AuthenticatedRequest,
} from "../../middleware/auth.middleware.js";
import { impersonateAdminSchema, loginSchema } from "../../types/auth.schema.js";

const router = Router();

const userInclude = {
    userPermissions: { include: { permission: true } },
};

function serializeUser(user: {
    id: string;
    username: string;
    name: string | null;
    role: string;
    status: string;
    userPermissions: { permission: { key: string } }[];
}) {
    const permissions = user.userPermissions.map((item) => item.permission.key).sort();

    return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: user.status,
        permissions,
    };
}

router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: { username },
            include: userInclude,
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
            return;
        }

        if (user.status !== "ACTIVE") {
            res.status(403).json({
                success: false,
                message: "This admin user is disabled.",
            });
            return;
        }

        const token = jwt.sign(
            { role: user.role },
            env.jwtSecret,
            {
                subject: user.id,
                expiresIn: env.jwtExpiresIn,
            }
        );

        const safeUser = serializeUser(user);

        res.status(200).json({
            success: true,
            data: {
                token,
                user: safeUser,
                role: safeUser.role,
                permissions: safeUser.permissions,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get("/me", authenticate, async (req: AuthenticatedRequest, res) => {
    res.status(200).json({
        success: true,
        data: {
            user: req.user,
            role: req.user?.role,
            permissions: req.user?.permissions ?? [],
        },
    });
});

router.post(
    "/impersonate",
    authenticate,
    requireSuperAdmin,
    async (req: AuthenticatedRequest, res, next) => {
        try {
            const { userId } = impersonateAdminSchema.parse(req.body);
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: userInclude,
            });

            if (!user) {
                res.status(404).json({ success: false, message: "Account not found." });
                return;
            }

            if (user.status !== "ACTIVE") {
                res.status(400).json({ success: false, message: "Disabled accounts cannot be selected." });
                return;
            }

            if (user.role === "CUSTOMER") {
                res.status(400).json({ success: false, message: "Customer accounts cannot access the admin dashboard." });
                return;
            }

            if (user.id === req.user?.id) {
                res.status(400).json({ success: false, message: "This account is already active." });
                return;
            }

            const token = jwt.sign(
                {
                    role: user.role,
                    impersonatedBy: req.user?.id,
                },
                env.jwtSecret,
                {
                    subject: user.id,
                    expiresIn: env.jwtExpiresIn,
                }
            );
            const safeUser = serializeUser(user);

            res.status(200).json({
                success: true,
                data: {
                    token,
                    user: safeUser,
                    role: safeUser.role,
                    permissions: safeUser.permissions,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post("/logout", authenticate, async (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
});

export default router;

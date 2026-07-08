import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { loginSchema } from "../../types/auth.schema.js";

const router = Router();

router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
            return;
        }

        if (user.status && user.status !== "ACTIVE") {
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

        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email ?? null,
                    username: user.username ?? null,
                    name: user.name,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;

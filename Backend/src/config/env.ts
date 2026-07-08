import dotenv from "dotenv";
import { z } from "zod";
import type { SignOptions } from "jsonwebtoken";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(5000),

    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),

    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default("1d"),

    ADMIN_EMAIL: z.string().email(),
    ADMIN_USERNAME: z.string().min(3).optional(),
    ADMIN_PASSWORD: z.string().min(6),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
    ...parsedEnv,
    jwtSecret: parsedEnv.JWT_SECRET,
    jwtExpiresIn: parsedEnv.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    nodeEnv: parsedEnv.NODE_ENV,
};

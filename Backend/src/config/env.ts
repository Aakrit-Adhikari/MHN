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

    PUBLIC_APP_URL: z.string().url().default("http://localhost:5000"),
    CUSTOMER_APP_URL: z.string().url().default("http://localhost:5000"),
    ALLOW_MOCK_OAUTH: z.coerce.boolean().default(true),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    FACEBOOK_CLIENT_ID: z.string().optional(),
    FACEBOOK_CLIENT_SECRET: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_CLIENT_SECRET: z.string().optional(),
    NEWSLETTER_FROM_EMAIL: z.string().email().optional(),
    NEWSLETTER_FROM_NAME: z.string().default("Mountain Helicopters Nepal"),
    NEWSLETTER_EMAIL_PROVIDER: z.string().default("mock"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(465),
    SMTP_SECURE: z.coerce.boolean().default(true),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
    ...parsedEnv,
    jwtSecret: parsedEnv.JWT_SECRET,
    jwtExpiresIn: parsedEnv.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    nodeEnv: parsedEnv.NODE_ENV,
};

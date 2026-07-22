import bcrypt from "bcryptjs";
import type { AuthProvider, CustomerAccount } from "@prisma/client";
import { type Request, type Response, Router } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import {
    authenticateCustomer,
    type CustomerAuthenticatedRequest,
} from "../../middleware/customer-auth.middleware.js";

const router = Router();

type OAuthProvider = Exclude<AuthProvider, "LOCAL">;

type OAuthProviderConfig = {
    authUrl: string;
    tokenUrl: string;
    userUrl?: string;
    scope: string;
    clientId?: string;
    clientSecret?: string;
};

const providerConfig: Record<OAuthProvider, OAuthProviderConfig> = {
    GOOGLE: {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
        scope: "openid email profile",
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    FACEBOOK: {
        authUrl: "https://www.facebook.com/v20.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token",
        userUrl: "https://graph.facebook.com/me?fields=id,name,email,picture",
        scope: "email,public_profile",
        clientId: env.FACEBOOK_CLIENT_ID,
        clientSecret: env.FACEBOOK_CLIENT_SECRET,
    },
    APPLE: {
        authUrl: "https://appleid.apple.com/auth/authorize",
        tokenUrl: "https://appleid.apple.com/auth/token",
        scope: "name email",
        clientId: env.APPLE_CLIENT_ID,
        clientSecret: env.APPLE_CLIENT_SECRET,
    },
};

const serializeCustomer = (customer: CustomerAccount) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    avatarUrl: customer.avatarUrl,
    category: customer.category,
    totalBookings: customer.totalBookings,
    totalSpent: customer.totalSpent,
    lastBookingAt: customer.lastBookingAt,
    createdAt: customer.createdAt,
});

const signCustomerToken = (customer: CustomerAccount) => jwt.sign(
    { type: "CUSTOMER", email: customer.email },
    env.jwtSecret,
    {
        subject: customer.id,
        expiresIn: env.jwtExpiresIn,
    }
);

const normalizeProvider = (provider: string): OAuthProvider | null => {
    const normalized = provider.toUpperCase();
    if (normalized === "GOOGLE" || normalized === "FACEBOOK" || normalized === "APPLE") {
        return normalized;
    }

    return null;
};

const isAllowedOAuthReturnTo = (value: string) => {
    try {
        const url = new URL(value);
        const customerAppUrl = new URL(env.CUSTOMER_APP_URL);

        return (
            ["http:", "https:"].includes(url.protocol) &&
            (
                url.origin === customerAppUrl.origin ||
                url.hostname === "127.0.0.1" ||
                url.hostname === "localhost"
            )
        );
    } catch {
        return false;
    }
};

const encodeOAuthState = (returnTo: string) => Buffer
    .from(JSON.stringify({ returnTo }), "utf8")
    .toString("base64url");

const decodeOAuthState = (state: unknown) => {
    if (typeof state !== "string") return null;

    try {
        const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { returnTo?: unknown };
        return typeof parsed.returnTo === "string" && isAllowedOAuthReturnTo(parsed.returnTo)
            ? parsed.returnTo
            : null;
    } catch {
        return null;
    }
};

const getRequestBody = (req: Request) => (
    req.body && typeof req.body === "object"
        ? req.body as Record<string, unknown>
        : {}
);

const getOAuthReturnTo = (req: Request) => {
    const body = getRequestBody(req);
    const state = req.method === "POST" ? body.state : req.query.state;

    return decodeOAuthState(state) || env.CUSTOMER_APP_URL;
};

const redirectWithOAuthParam = (
    res: Response,
    returnTo: string,
    param: "oauthToken" | "oauthError",
    value: string
) => {
    const url = new URL(returnTo);
    url.searchParams.set(param, value);
    res.redirect(url.toString());
};

const getAppleName = (user: unknown) => {
    if (typeof user !== "string") return null;

    try {
        const parsed = JSON.parse(user) as { name?: { firstName?: string; lastName?: string } };
        return [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean).join(" ") || null;
    } catch {
        return null;
    }
};

const getAppleProfile = (idToken: unknown, user: unknown, clientId: string) => {
    if (typeof idToken !== "string") {
        throw new Error("Apple identity token is missing");
    }

    const payload = jwt.decode(idToken) as JwtPayload | null;
    if (!payload?.sub) {
        throw new Error("Apple identity token is invalid");
    }

    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audience.includes(clientId)) {
        throw new Error("Apple identity token audience is invalid");
    }

    return {
        providerUserId: payload.sub,
        email: typeof payload.email === "string" ? payload.email : null,
        name: getAppleName(user),
        avatarUrl: null,
    };
};

async function getOAuthProfile(input: {
    provider: OAuthProvider;
    tokenData: Record<string, unknown>;
    callbackUser: unknown;
}) {
    const config = providerConfig[input.provider];

    if (input.provider === "APPLE") {
        return getAppleProfile(input.tokenData.id_token, input.callbackUser, config.clientId || "");
    }

    if (!config.userUrl || typeof input.tokenData.access_token !== "string") {
        throw new Error("OAuth profile fetch failed");
    }

    const userResponse = await fetch(config.userUrl, {
        headers: { Authorization: `Bearer ${input.tokenData.access_token}` },
    });
    const profile = await userResponse.json();

    if (!userResponse.ok) {
        throw new Error("OAuth profile fetch failed");
    }

    return {
        providerUserId: String(profile.sub || profile.id),
        email: profile.email || null,
        name: profile.name || null,
        avatarUrl: profile.picture?.data?.url || profile.picture || null,
    };
}

async function findOrCreateOAuthCustomer(input: {
    provider: OAuthProvider;
    providerUserId: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
}) {
    const existingProvider = await prisma.customerAuthProvider.findUnique({
        where: {
            provider_providerUserId: {
                provider: input.provider,
                providerUserId: input.providerUserId,
            },
        },
        include: { customer: true },
    });

    if (existingProvider) return existingProvider.customer;

    const normalizedEmail = input.email?.trim().toLowerCase();
    let customer = normalizedEmail
        ? await prisma.customerAccount.findUnique({ where: { email: normalizedEmail } })
        : null;

    if (!customer) {
        customer = await prisma.customerAccount.create({
            data: {
                name: input.name || `${input.provider.toLowerCase()} customer`,
                email: normalizedEmail || `${input.provider.toLowerCase()}-${input.providerUserId}@oauth.local`,
                avatarUrl: input.avatarUrl,
            },
        });
    }

    await prisma.customerAuthProvider.create({
        data: {
            customerId: customer.id,
            provider: input.provider,
            providerUserId: input.providerUserId,
            providerEmail: normalizedEmail,
        },
    });

    return customer;
}

router.post("/register", async (req, res, next) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            res.status(400).json({ success: false, message: "All fields are required" });
            return;
        }

        if (password !== confirmPassword) {
            res.status(400).json({ success: false, message: "Passwords do not match" });
            return;
        }

        if (String(password).length < 8) {
            res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
            return;
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const existing = await prisma.customerAccount.findUnique({ where: { email: normalizedEmail } });

        if (existing) {
            res.status(409).json({ success: false, message: "Email is already registered" });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const customer = await prisma.customerAccount.create({
            data: {
                name: String(name).trim(),
                email: normalizedEmail,
                passwordHash,
                authProviders: {
                    create: {
                        provider: "LOCAL",
                        providerUserId: normalizedEmail,
                        providerEmail: normalizedEmail,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: {
                token: signCustomerToken(customer),
                customer: serializeCustomer(customer),
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        const customer = await prisma.customerAccount.findUnique({ where: { email } });

        if (!customer?.passwordHash || !(await bcrypt.compare(password, customer.passwordHash))) {
            res.status(401).json({ success: false, message: "Invalid email or password" });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                token: signCustomerToken(customer),
                customer: serializeCustomer(customer),
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get("/me", authenticateCustomer, async (req: CustomerAuthenticatedRequest, res, next) => {
    try {
        const customer = await prisma.customerAccount.findUnique({
            where: { id: req.customer?.id },
        });

        if (!customer) {
            res.status(401).json({ success: false, message: "Customer session is invalid" });
            return;
        }

        res.status(200).json({ success: true, data: serializeCustomer(customer) });
    } catch (error) {
        next(error);
    }
});

router.get("/oauth/providers", (_req, res) => {
    res.status(200).json({
        success: true,
        data: Object.entries(providerConfig).map(([provider, config]) => ({
            provider: provider.toLowerCase(),
            configured: Boolean(config.clientId && config.clientSecret),
        })),
    });
});

router.get("/status", async (_req, res, next) => {
    try {
        const [tables] = await prisma.$queryRaw<Array<{
            customerAccounts: string | null;
            customerAuthProviders: string | null;
        }>>`
            select
                to_regclass('public.customer_accounts')::text as "customerAccounts",
                to_regclass('public.customer_auth_providers')::text as "customerAuthProviders"
        `;

        const missingTables = [
            tables.customerAccounts ? null : "customer_accounts",
            tables.customerAuthProviders ? null : "customer_auth_providers",
        ].filter(Boolean);

        res.status(200).json({
            success: true,
            data: {
                databaseReady: missingTables.length === 0,
                missingTables,
                oauthProviders: Object.entries(providerConfig).map(([provider, config]) => ({
                    provider: provider.toLowerCase(),
                    configured: Boolean(config.clientId && config.clientSecret),
                })),
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get("/oauth/:provider/start", (req, res) => {
    const provider = normalizeProvider(String(req.params.provider || ""));
    const returnTo = typeof req.query.returnTo === "string" && isAllowedOAuthReturnTo(req.query.returnTo)
        ? req.query.returnTo
        : null;

    if (!provider) {
        if (returnTo) {
            redirectWithOAuthParam(res, returnTo, "oauthError", "Unknown OAuth provider");
            return;
        }

        res.status(404).json({ success: false, message: "Unknown OAuth provider" });
        return;
    }

    const config = providerConfig[provider];
    if (!config.clientId || !config.clientSecret) {
        const message = `${provider} OAuth credentials are missing from Backend/.env`;
        if (returnTo) {
            redirectWithOAuthParam(res, returnTo, "oauthError", message);
            return;
        }

        res.status(400).json({
            success: false,
            message,
        });
        return;
    }

    const redirectUri = `${env.PUBLIC_APP_URL}/api/auth/oauth/${provider.toLowerCase()}/callback`;
    const url = new URL(config.authUrl);
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", config.scope);

    if (returnTo) {
        url.searchParams.set("state", encodeOAuthState(returnTo));
    }

    if (provider === "APPLE") {
        url.searchParams.set("response_mode", "form_post");
    }

    res.redirect(url.toString());
});

const handleOAuthCallback = async (req: Request, res: Response) => {
    const provider = normalizeProvider(String(req.params.provider || ""));
    const body = getRequestBody(req);
    const returnTo = getOAuthReturnTo(req);
    const codeParam = req.method === "POST" ? body.code : req.query.code;
    const code = typeof codeParam === "string" ? codeParam : null;

    if (!provider || !code) {
        redirectWithOAuthParam(res, returnTo, "oauthError", "Invalid OAuth callback");
        return;
    }

    try {
        const config = providerConfig[provider];
        const redirectUri = `${env.PUBLIC_APP_URL}/api/auth/oauth/${provider.toLowerCase()}/callback`;
        const tokenResponse = await fetch(config.tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: config.clientId || "",
                client_secret: config.clientSecret || "",
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
                code,
            }),
        });
        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || (!tokenData.access_token && !tokenData.id_token)) {
            throw new Error("OAuth token exchange failed");
        }

        const profile = await getOAuthProfile({
            provider,
            tokenData,
            callbackUser: body.user,
        });

        const customer = await findOrCreateOAuthCustomer({
            provider,
            providerUserId: profile.providerUserId,
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
        });

        redirectWithOAuthParam(res, returnTo, "oauthToken", signCustomerToken(customer));
    } catch (error) {
        const message = error instanceof Error ? error.message : "OAuth login failed";
        redirectWithOAuthParam(res, returnTo, "oauthError", message);
    }
};

router.get("/oauth/:provider/callback", handleOAuthCallback);
router.post("/oauth/:provider/callback", handleOAuthCallback);

router.post("/oauth/:provider/mock", async (req, res, next) => {
    try {
        if (!env.ALLOW_MOCK_OAUTH) {
            res.status(403).json({ success: false, message: "Mock OAuth is disabled" });
            return;
        }

        const provider = normalizeProvider(String(req.params.provider || ""));
        if (!provider) {
            res.status(404).json({ success: false, message: "Unknown OAuth provider" });
            return;
        }

        const providerName = provider.toLowerCase();
        const customer = await findOrCreateOAuthCustomer({
            provider,
            providerUserId: `${providerName}-mock-user`,
            email: `${providerName}.demo@mhn.test`,
            name: `${providerName.charAt(0).toUpperCase()}${providerName.slice(1)} Demo User`,
            avatarUrl: null,
        });

        res.status(200).json({
            success: true,
            data: {
                token: signCustomerToken(customer),
                customer: serializeCustomer(customer),
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;

import crypto from "crypto";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import {
    authenticate,
    requirePermission,
    type AuthenticatedRequest,
} from "../../middleware/auth.middleware.js";
import {
    createNewsletterSchema,
    sendNewsletterSchema,
    subscribeNewsletterSchema,
    testSendNewsletterSchema,
    updateNewsletterSchema,
    updateSubscriberSchema,
} from "../../types/newsletter.schema.js";
import { buildNewsletterEmail, sendNewsletterEmail } from "../../utils/newsletter-email.js";

export const publicNewsletterRouter = Router();
export const adminNewsletterRouter = Router();

const getParam = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

function createUnsubscribeToken() {
    return crypto.randomBytes(32).toString("hex");
}

function serializeSubscriber(subscriber: {
    id: string;
    email: string;
    name: string | null;
    isSubscribed: boolean;
    unsubscribedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}) {
    return subscriber;
}

async function getNewsletter(id: string) {
    return prisma.newsletter.findUnique({
        where: { id },
        include: {
            createdBy: { select: { id: true, name: true, username: true, email: true } },
            recipients: { orderBy: { createdAt: "desc" } },
        },
    });
}

publicNewsletterRouter.post("/subscribe", async (req, res, next) => {
    try {
        const data = subscribeNewsletterSchema.parse(req.body);

        const subscriber = await prisma.newsletterSubscriber.upsert({
            where: { email: data.email },
            update: {
                name: data.name,
                isSubscribed: true,
                unsubscribedAt: null,
            },
            create: {
                email: data.email,
                name: data.name,
                unsubscribeToken: createUnsubscribeToken(),
            },
        });

        res.status(200).json({
            success: true,
            data: serializeSubscriber(subscriber),
            message: "Subscribed to newsletter successfully",
        });
    } catch (error) {
        next(error);
    }
});

publicNewsletterRouter.get("/unsubscribe", async (req, res, next) => {
    try {
        const token = typeof req.query.token === "string" ? req.query.token : "";

        if (!token) {
            res.status(400).json({ success: false, message: "Unsubscribe token is required" });
            return;
        }

        const subscriber = await prisma.newsletterSubscriber.findUnique({
            where: { unsubscribeToken: token },
        });

        if (!subscriber) {
            res.status(404).json({ success: false, message: "Newsletter subscriber not found" });
            return;
        }

        const updatedSubscriber = await prisma.newsletterSubscriber.update({
            where: { id: subscriber.id },
            data: {
                isSubscribed: false,
                unsubscribedAt: new Date(),
            },
        });

        res.status(200).json({
            success: true,
            data: serializeSubscriber(updatedSubscriber),
            message: "You have been unsubscribed from newsletter emails",
        });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.use(authenticate, requirePermission("VIEW_NEWSLETTERS"));

adminNewsletterRouter.get("/subscribers", async (req, res, next) => {
    try {
        const subscribed = req.query.subscribed;
        const where = subscribed === "true"
            ? { isSubscribed: true }
            : subscribed === "false"
                ? { isSubscribed: false }
                : {};

        const subscribers = await prisma.newsletterSubscriber.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ success: true, data: subscribers.map(serializeSubscriber) });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.post("/subscribers", async (req, res, next) => {
    try {
        const data = subscribeNewsletterSchema.parse(req.body);
        const subscriber = await prisma.newsletterSubscriber.upsert({
            where: { email: data.email },
            update: {
                name: data.name,
                isSubscribed: true,
                unsubscribedAt: null,
            },
            create: {
                email: data.email,
                name: data.name,
                unsubscribeToken: createUnsubscribeToken(),
            },
        });

        res.status(201).json({ success: true, data: serializeSubscriber(subscriber) });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.patch("/subscribers/:id", async (req, res, next) => {
    try {
        const id = getParam(req.params.id);
        const data = updateSubscriberSchema.parse(req.body);
        const subscriber = await prisma.newsletterSubscriber.update({
            where: { id },
            data: {
                ...data,
                ...(data.isSubscribed === false ? { unsubscribedAt: new Date() } : {}),
                ...(data.isSubscribed === true ? { unsubscribedAt: null } : {}),
            },
        });

        res.status(200).json({ success: true, data: serializeSubscriber(subscriber) });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.delete("/subscribers/:id", async (req, res, next) => {
    try {
        const id = getParam(req.params.id);
        const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });

        if (!subscriber) {
            res.status(404).json({ success: false, message: "Newsletter subscriber not found" });
            return;
        }

        await prisma.newsletterSubscriber.delete({ where: { id } });

        res.status(200).json({
            success: true,
            message: "Newsletter subscriber deleted successfully",
        });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.get("/", async (_req, res, next) => {
    try {
        const newsletters = await prisma.newsletter.findMany({
            include: {
                createdBy: { select: { id: true, name: true, username: true, email: true } },
                _count: { select: { recipients: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ success: true, data: newsletters });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.post("/", async (req: AuthenticatedRequest, res, next) => {
    try {
        const data = createNewsletterSchema.parse(req.body);
        const newsletter = await prisma.newsletter.create({
            data: {
                ...data,
                createdById: req.user?.id,
            },
        });

        res.status(201).json({ success: true, data: newsletter });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.get("/:id", async (req, res, next) => {
    try {
        const newsletter = await getNewsletter(getParam(req.params.id));

        if (!newsletter) {
            res.status(404).json({ success: false, message: "Newsletter not found" });
            return;
        }

        res.status(200).json({ success: true, data: newsletter });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.patch("/:id", async (req, res, next) => {
    try {
        const id = getParam(req.params.id);
        const existingNewsletter = await prisma.newsletter.findUnique({ where: { id } });

        if (!existingNewsletter) {
            res.status(404).json({ success: false, message: "Newsletter not found" });
            return;
        }

        if (existingNewsletter.status !== "DRAFT") {
            res.status(400).json({
                success: false,
                message: "Only draft newsletters can be updated",
            });
            return;
        }

        const data = updateNewsletterSchema.parse(req.body);
        const newsletter = await prisma.newsletter.update({
            where: { id },
            data,
        });

        res.status(200).json({ success: true, data: newsletter });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.delete("/:id", async (req, res, next) => {
    try {
        const id = getParam(req.params.id);
        const existingNewsletter = await prisma.newsletter.findUnique({ where: { id } });

        if (!existingNewsletter) {
            res.status(404).json({ success: false, message: "Newsletter not found" });
            return;
        }

        if (existingNewsletter.status !== "DRAFT") {
            res.status(400).json({
                success: false,
                message: "Only draft newsletters can be deleted",
            });
            return;
        }

        await prisma.newsletter.delete({ where: { id } });
        res.status(200).json({ success: true, message: "Newsletter deleted successfully" });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.post("/:id/preview", async (req, res, next) => {
    try {
        const newsletter = await prisma.newsletter.findUnique({
            where: { id: getParam(req.params.id) },
        });

        if (!newsletter) {
            res.status(404).json({ success: false, message: "Newsletter not found" });
            return;
        }

        const email = buildNewsletterEmail({
            subject: newsletter.subject,
            previewText: newsletter.previewText,
            contentHtml: newsletter.contentHtml,
            contentText: newsletter.contentText,
            recipientEmail: "preview@example.com",
            recipientName: "Preview Recipient",
        });

        res.status(200).json({ success: true, data: email });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.post("/:id/test-send", async (req, res, next) => {
    try {
        const data = testSendNewsletterSchema.parse(req.body);
        const newsletter = await prisma.newsletter.findUnique({
            where: { id: getParam(req.params.id) },
        });

        if (!newsletter) {
            res.status(404).json({ success: false, message: "Newsletter not found" });
            return;
        }

        const result = await sendNewsletterEmail({
            to: data.email,
            subject: newsletter.subject,
            previewText: newsletter.previewText,
            contentHtml: newsletter.contentHtml,
            contentText: newsletter.contentText,
            recipientEmail: data.email,
            recipientName: data.name,
        });

        res.status(200).json({
            success: true,
            data: {
                provider: result.provider,
                messageId: result.messageId,
            },
            message: "Test newsletter email prepared successfully",
        });
    } catch (error) {
        next(error);
    }
});

adminNewsletterRouter.post("/:id/send", async (req, res, next) => {
    try {
        const id = getParam(req.params.id);
        const data = sendNewsletterSchema.parse(req.body);
        const newsletter = await prisma.newsletter.findUnique({ where: { id } });

        if (!newsletter) {
            res.status(404).json({ success: false, message: "Newsletter not found" });
            return;
        }

        if (newsletter.status !== "DRAFT") {
            res.status(400).json({
                success: false,
                message: "Only draft newsletters can be sent",
            });
            return;
        }

        if (newsletter.audienceType === "PREMIUM_USERS") {
            res.status(400).json({
                success: false,
                message: "Premium newsletter audience is not available yet",
            });
            return;
        }

        const subscribers = await prisma.newsletterSubscriber.findMany({
            where: {
                isSubscribed: true,
                ...(data.subscriberIds ? { id: { in: data.subscriberIds } } : {}),
            },
            orderBy: { createdAt: "asc" },
        });

        if (!subscribers.length) {
            res.status(400).json({
                success: false,
                message: "No subscribed recipients found",
            });
            return;
        }

        await prisma.newsletter.update({
            where: { id },
            data: { status: "SENDING" },
        });

        const results = await Promise.all(subscribers.map(async (subscriber) => {
            try {
                const result = await sendNewsletterEmail({
                    to: subscriber.email,
                    subject: newsletter.subject,
                    previewText: newsletter.previewText,
                    contentHtml: newsletter.contentHtml,
                    contentText: newsletter.contentText,
                    recipientEmail: subscriber.email,
                    recipientName: subscriber.name,
                    unsubscribeToken: subscriber.unsubscribeToken,
                });

                await prisma.newsletterRecipient.upsert({
                    where: {
                        newsletterId_email: {
                            newsletterId: id,
                            email: subscriber.email,
                        },
                    },
                    update: {
                        subscriberId: subscriber.id,
                        name: subscriber.name,
                        status: "SENT",
                        provider: result.provider,
                        error: null,
                        sentAt: new Date(),
                    },
                    create: {
                        newsletterId: id,
                        subscriberId: subscriber.id,
                        email: subscriber.email,
                        name: subscriber.name,
                        status: "SENT",
                        provider: result.provider,
                        sentAt: new Date(),
                    },
                });

                return { status: "SENT" as const };
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to send newsletter";

                await prisma.newsletterRecipient.upsert({
                    where: {
                        newsletterId_email: {
                            newsletterId: id,
                            email: subscriber.email,
                        },
                    },
                    update: {
                        subscriberId: subscriber.id,
                        name: subscriber.name,
                        status: "FAILED",
                        error: message,
                    },
                    create: {
                        newsletterId: id,
                        subscriberId: subscriber.id,
                        email: subscriber.email,
                        name: subscriber.name,
                        status: "FAILED",
                        error: message,
                    },
                });

                return { status: "FAILED" as const };
            }
        }));

        const failedCount = results.filter((result) => result.status === "FAILED").length;
        const sentCount = results.length - failedCount;
        const finalStatus = sentCount > 0 ? "SENT" : "FAILED";

        const updatedNewsletter = await prisma.newsletter.update({
            where: { id },
            data: {
                status: finalStatus,
                sentAt: sentCount > 0 ? new Date() : null,
            },
            include: {
                _count: { select: { recipients: true } },
            },
        });

        res.status(200).json({
            success: true,
            data: {
                newsletter: updatedNewsletter,
                sentCount,
                failedCount,
            },
            message: "Newsletter send completed",
        });
    } catch (error) {
        next(error);
    }
});

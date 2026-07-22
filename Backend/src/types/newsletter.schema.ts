import { z } from "zod";

const emptyToNull = (value: unknown) => value === "" ? null : value;

export const newsletterAudienceSchema = z.enum([
    "ALL_SUBSCRIBERS",
    "PREMIUM_USERS",
    "CUSTOM",
]);

const newsletterBaseSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    subject: z.string().min(3, "Subject must be at least 3 characters"),
    previewText: z.preprocess(
        emptyToNull,
        z.string().max(180).nullable().optional()
    ),
    contentHtml: z.string().min(10, "HTML content must be at least 10 characters"),
    contentText: z.preprocess(
        emptyToNull,
        z.string().min(10).nullable().optional()
    ),
    audienceType: newsletterAudienceSchema.default("ALL_SUBSCRIBERS"),
});

export const createNewsletterSchema = newsletterBaseSchema;

export const updateNewsletterSchema = newsletterBaseSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
);

export const subscribeNewsletterSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    name: z.preprocess(emptyToNull, z.string().min(2).max(120).nullable().optional()),
});

export const updateSubscriberSchema = z.object({
    email: z.string().trim().toLowerCase().email().optional(),
    name: z.preprocess(emptyToNull, z.string().min(2).max(120).nullable().optional()),
    isSubscribed: z.boolean().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
);

export const sendNewsletterSchema = z.object({
    subscriberIds: z.array(z.string()).min(1).optional(),
});

export const testSendNewsletterSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    name: z.preprocess(emptyToNull, z.string().min(2).max(120).nullable().optional()),
});

export type CreateNewsletterInput = z.infer<typeof createNewsletterSchema>;
export type UpdateNewsletterInput = z.infer<typeof updateNewsletterSchema>;

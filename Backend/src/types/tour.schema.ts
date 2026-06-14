import { z } from "zod";
import { slugify } from "../utils/slugify.js";

export const createTourSchema = z.object({
    title: z.string().min(5, "Title is too short"),
    slug: z.string().optional(),
    summary: z.string().min(10).max(255),
    content: z.string(),
    priceFrom: z.number().int().positive().optional(),
    duration: z.string().optional(),
    isPublished: z.boolean().default(true),
}).transform((data) => ({
    ...data,
    slug: slugify(data.slug || data.title),
}));

export const tourResponseSchema = z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    photoUrl: z.string().nullable().optional(),
    priceFrom: z.number().nullable(),
    duration: z.string().nullable(),
});

export type TourResponse = z.infer<typeof tourResponseSchema>;

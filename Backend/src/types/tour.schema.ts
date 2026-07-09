import { z } from "zod";
import { slugify } from "../utils/slugify.js";

const tourBaseSchema = z.object({
    title: z.string().min(5, "Title is too short"),
    slug: z.string().optional(),
    summary: z.string().min(10).max(255),
    description: z.string().min(1, "Description is required"),
    metaTitle: z.string().max(120).nullable().optional(),
    metaDescription: z.string().max(255).nullable().optional(),
    categoryId: z.string().nullable().optional(),
    price: z.number().int().positive().nullable().optional(),
    duration: z.string().nullable().optional(),
    altitude: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    groupSize: z.string().nullable().optional(),
    bestSeason: z.string().nullable().optional(),
    contentImageUrl: z.string().nullable().optional(),
});

export const createTourSchema = tourBaseSchema.transform((data) => ({
    ...data,
    slug: slugify(data.slug || data.title),
}));

export const updateTourSchema = tourBaseSchema.partial().transform((data) => ({
    ...data,
    ...(data.slug ? { slug: slugify(data.slug) } : {}),
}));

export const tourResponseSchema = z.object({
    id: z.string(),
    categoryId: z.string().nullable().optional(),
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    description: z.string(),
    metaTitle: z.string().nullable().optional(),
    metaDescription: z.string().nullable().optional(),
    coverImageUrl: z.string().nullable().optional(),
    contentImageUrl: z.string().nullable().optional(),
    price: z.number().nullable().optional(),
    duration: z.string().nullable().optional(),
    altitude: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    groupSize: z.string().nullable().optional(),
    bestSeason: z.string().nullable().optional(),
});

export type TourResponse = z.infer<typeof tourResponseSchema>;

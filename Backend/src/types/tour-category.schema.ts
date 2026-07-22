import { z } from "zod";

import { slugify } from "../utils/slugify.js";

const tourCategoryBaseSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().optional(),
});

export const createTourCategorySchema = tourCategoryBaseSchema.transform((data) => ({
    ...data,
    slug: slugify(data.slug || data.name),
}));

export const updateTourCategorySchema = tourCategoryBaseSchema.partial().transform((data) => ({
    ...data,
    ...(data.slug ? { slug: slugify(data.slug) } : {}),
}));

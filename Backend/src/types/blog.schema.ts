import { z } from "zod";
import { slugify } from "../utils/slugify.js";

const blogPostBaseSchema = z.object({
    slug: z.string().optional(),
    title: z.string().min(3, "Title must be at least 3 characters"),
    content: z.string().min(10, "Content must be at least 10 characters"),
    metaTitle: z.string().max(120).nullable().optional(),
    metaDescription: z.string().max(255).nullable().optional(),
    imageUrl: z.string().nullable().optional(),
});

export const createBlogPostSchema = blogPostBaseSchema.transform((data) => ({
    ...data,
    slug: slugify(data.slug || data.title),
}));

export const partialBlogPostSchema = blogPostBaseSchema.partial().transform((data) => ({
    ...data,
    ...(data.slug ? { slug: slugify(data.slug) } : {}),
}));

export const updateBlogPostSchema = partialBlogPostSchema.refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
);

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

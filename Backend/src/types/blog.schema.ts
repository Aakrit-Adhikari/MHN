import { z } from "zod";

export const createBlogPostSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    content: z.string().min(10, "Content must be at least 10 characters"),
});

export const partialBlogPostSchema = createBlogPostSchema.partial();

export const updateBlogPostSchema = partialBlogPostSchema.refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
);

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

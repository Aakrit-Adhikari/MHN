import { z } from "zod";

export const createTourFaqSchema = z.object({
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required"),
    sortOrder: z.coerce.number().int().min(1).optional(),
});

export const updateTourFaqSchema = createTourFaqSchema.partial();

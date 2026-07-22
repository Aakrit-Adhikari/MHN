import { z } from "zod";

export const observanceSchema = z.object({
    topic: z.string().min(1, "Observance topic is required"),
    description: z.string().min(1, "Observance description is required"),
});

export const observancesSchema = z.array(observanceSchema).max(50);

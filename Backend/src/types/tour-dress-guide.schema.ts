import { z } from "zod";

export const dressGuideItemSchema = z.object({
    layer: z.string().min(1, "Layer is required"),
    item: z.string().min(1, "Item is required"),
    why: z.string().min(1, "Why is required"),
});

export const replaceDressGuideSchema = z.object({
    items: z.array(dressGuideItemSchema).max(50),
});

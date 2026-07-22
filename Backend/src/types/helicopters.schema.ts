import { z } from "zod";

const helicopterFields = {
    helicopterNumber: z.string().trim().min(1, "Helicopter number is required").max(100),
    model: z.string().trim().min(1, "Model is required").max(150),
    pictureUrl: z.string().trim().min(1).optional(),
};

export const createHelicopterSchema = z.object(helicopterFields);
export const updateHelicopterSchema = z.object(helicopterFields).partial().refine(
    (data) => Object.keys(data).length > 0,
    "At least one field is required"
);

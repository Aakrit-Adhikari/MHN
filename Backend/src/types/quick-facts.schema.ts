import { z } from "zod";

export const quickFactsSchema = z.object({
    duration: z.string().min(1).optional(),
    maxAltitude: z.string().min(1).optional(),
    difficultyLevel: z.string().min(1).optional(),
    privateCharterPrice: z.string().min(1).optional(),
    hotelPickup: z.string().min(1).optional(),
    tourFlightDuration: z.string().min(1).optional(),
    minRecommendedAge: z.string().min(1).optional(),
    idealTime: z.string().min(1).optional(),
    travelInsurance: z.string().min(1).optional(),
    helicopterType: z.string().min(1).optional(),
    bestSeason: z.string().min(1).optional(),
    mealsIncluded: z.string().min(1).optional(),
    helicopterCapacity: z.string().min(1).optional(),
    sharedTourPrice: z.string().min(1).optional(),
    permitsIncluded: z.string().min(1).optional(),
});

export type QuickFacts = z.infer<typeof quickFactsSchema>;

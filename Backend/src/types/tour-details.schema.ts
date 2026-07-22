import { z } from "zod";

export const flightFeelsSchema = z.object({
    topic: z.string().min(1, "Flight Feels topic is required"),
    description: z.string().min(1, "Flight Feels description is required"),
    tourMap: z.string().url("Tour map must be a valid URL").optional().or(z.literal("")),
});

export const journeySchema = z.array(z.object({
    stepNo: z.coerce.number().int().positive(),
    time: z.string().min(1, "Journey time is required"),
    topic: z.string().min(1, "Journey topic is required"),
    summary: z.string().min(1, "Journey summary is required"),
})).max(50);

export const peaksEncounteredSchema = z.array(z.object({
    peakName: z.string().min(1, "Peak name is required"),
    rankLabel: z.string().min(1, "Peak rank label is required"),
    elevation: z.string().min(1, "Peak elevation is required"),
    description: z.string().min(1, "Peak description is required"),
    tag: z.string().optional(),
})).max(50);

export const includedPermitsSchema = z.array(z.object({
    permitName: z.string().min(1, "Permit name is required"),
    departmentOrMunicipality: z.string().min(1, "Department or municipality is required"),
    usdAmount: z.string().min(1, "USD amount is required"),
    nepaliAmount: z.string().min(1, "Nepali amount is required"),
    importantNotice: z.string().min(1, "Important notice is required"),
})).max(50);

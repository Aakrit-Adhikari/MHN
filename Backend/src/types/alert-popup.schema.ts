import { z } from "zod";

const emptyStringToNull = z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().nullable().optional()
);

const optionalDate = z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.coerce.date().nullable().optional()
);

export const createAlertPopupSchema = z.object({
    title: emptyStringToNull,
    linkUrl: emptyStringToNull,
    isActive: z.coerce.boolean().default(true),
    startsAt: optionalDate,
    endsAt: optionalDate,
});

export const updateAlertPopupSchema = createAlertPopupSchema.partial();

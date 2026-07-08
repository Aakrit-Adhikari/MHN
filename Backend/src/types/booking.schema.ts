import { z } from 'zod';
import { SourceTypeSchema } from './inquiry.schema.js';

const optionalText = z.preprocess(
    (value) => {
        if (value === null || value === undefined) return value;
        if (typeof value === 'string' && value.trim() === '') return null;
        return value;
    },
    z.string().nullable().optional()
);

const optionalInt = z.preprocess(
    (value) => {
        if (value === '' || value === null || value === undefined) return null;
        if (typeof value === 'string') return parseInt(value, 10);
        return value;
    },
    z.number().int().nonnegative().nullable().optional()
);

export const BookingStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']);

export const CreateBookingSchema = z.object({
    inquiryId: z.string().nullable().optional(),
    tourId: z.string().nullable().optional(),
    customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
    customerEmail: z.string().email('Invalid email address').nullable().optional(),
    customerPhone: optionalText,
    bookingDate: z.coerce.date().nullable().optional(),
    amount: optionalInt,
    currency: z.string().min(3).max(3).optional(),
    status: BookingStatusSchema.optional(),
    notes: optionalText,
    sourceType: SourceTypeSchema.nullable().optional(),
    sourceName: optionalText,
    sourceMedium: optionalText,
    campaignName: optionalText,
    utmSource: optionalText,
    utmMedium: optionalText,
    utmCampaign: optionalText,
    utmTerm: optionalText,
    utmContent: optionalText,
    referrerUrl: optionalText,
    landingPage: optionalText,
    sourceNote: optionalText,
});

export const UpdateBookingSchema = CreateBookingSchema.partial();

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingInput = z.infer<typeof UpdateBookingSchema>;

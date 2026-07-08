import { z } from 'zod';

export const InquiryTypeSchema = z.enum(['BOOKING', 'CHARTER', 'CONTACT']);
export const InquiryStatusSchema = z.enum(['NEW', 'IN_PROGRESS', 'CONTACTED', 'CONVERTED', 'CLOSED']);
export const SourceTypeSchema = z.enum([
    'WEBSITE',
    'ADS',
    'SOCIAL',
    'OTA',
    'WHATSAPP',
    'PHONE',
    'REFERRAL',
    'WALK_IN',
    'MANUAL',
    'OTHER',
]);

const optionalText = z.preprocess(
    (value) => {
        if (value === null || value === undefined) return value;
        if (typeof value === 'string' && value.trim() === '') return null;
        return value;
    },
    z.string().nullable().optional()
);

export const CreateInquirySchema = z.object({
    inquiryType: InquiryTypeSchema,
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: optionalText,
    preferredDate: z.coerce.date().nullable().optional(),
    message: z.string().min(10, "Message must be at least 10 characters"),
    tourId: z.string().nullable().optional(),
    status: InquiryStatusSchema.optional(),
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

export const UpdateInquirySchema = CreateInquirySchema.partial();

export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof UpdateInquirySchema>;

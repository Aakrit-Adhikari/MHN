import { z } from 'zod';

export const InquiryTypeSchema = z.enum(['BOOKING', 'CHARTER', 'CONTACT']);

export const CreateInquirySchema = z.object({
    type: InquiryTypeSchema,
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    message: z.string().min(10, "Message must be at least 10 characters"),
    locale: z.string().default('en'),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    tourId: z.string().optional(),
});

export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;


import type { Prisma, SourceType } from "@prisma/client";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import {
    CreateInquirySchema,
    UpdateInquirySchema,
} from "../../types/inquiry.schema.js";

const router = Router();

const sourceFields = [
    "sourceName",
    "sourceMedium",
    "campaignName",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmTerm",
    "utmContent",
    "referrerUrl",
    "landingPage",
    "sourceNote",
] as const;

const sourceAliases = {
    source_type: "sourceType",
    source_name: "sourceName",
    source_medium: "sourceMedium",
    campaign_name: "campaignName",
    utm_source: "utmSource",
    utm_medium: "utmMedium",
    utm_campaign: "utmCampaign",
    utm_term: "utmTerm",
    utm_content: "utmContent",
    referrer_url: "referrerUrl",
    landing_page: "landingPage",
    source_note: "sourceNote",
} as const;

type SourceInput = {
    sourceType?: SourceType | null;
    sourceName?: string | null;
    sourceMedium?: string | null;
    campaignName?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
    referrerUrl?: string | null;
    landingPage?: string | null;
    sourceNote?: string | null;
};

const getParam = (value: string | string[]) => {
    return Array.isArray(value) ? value[0] : value;
};

const normalizeInquiryBody = (body: Record<string, any>) => {
    if (body.inquiryType === undefined && body.type !== undefined) {
        body.inquiryType = body.type;
    }

    for (const [oldKey, newKey] of Object.entries(sourceAliases)) {
        if (body[newKey] === undefined && body[oldKey] !== undefined) {
            body[newKey] = body[oldKey];
        }
    }

    ["tourId", "phone", "preferredDate", "sourceType", ...sourceFields].forEach((key) => {
        if (body[key] === "") {
            body[key] = null;
        }
    });
};

const sourceData = (data: SourceInput) => ({
    sourceType: data.sourceType,
    sourceName: data.sourceName,
    sourceMedium: data.sourceMedium,
    campaignName: data.campaignName,
    utmSource: data.utmSource,
    utmMedium: data.utmMedium,
    utmCampaign: data.utmCampaign,
    utmTerm: data.utmTerm,
    utmContent: data.utmContent,
    referrerUrl: data.referrerUrl,
    landingPage: data.landingPage,
    sourceNote: data.sourceNote,
});

const hasSourceUpdate = (body: Record<string, unknown>) => {
    return ["sourceType", ...sourceFields].some((key) =>
        Object.prototype.hasOwnProperty.call(body, key)
    );
};

router.post("/", async (req, res, next) => {
    try {
        normalizeInquiryBody(req.body);
        const validatedData = CreateInquirySchema.parse(req.body);

        let tour: Awaited<ReturnType<typeof prisma.tour.findUnique>> = null;

        if (validatedData.tourId) {
            tour = await prisma.tour.findUnique({
                where: { id: validatedData.tourId },
            });

            if (!tour) {
                res.status(400).json({
                    success: false,
                    message: "Invalid tourId: The tour does not exist.",
                });
                return;
            }
        }

        if (validatedData.inquiryType === "BOOKING" && !validatedData.tourId) {
            res.status(400).json({
                success: false,
                message: "tourId is required for BOOKING inquiries",
            });
            return;
        }

        const inquiryData = {
            inquiryType: validatedData.inquiryType,
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            preferredDate: validatedData.preferredDate,
            message: validatedData.message,
            status: validatedData.status,
            tourId: validatedData.tourId,
            ...sourceData(validatedData),
        } satisfies Prisma.InquiryUncheckedCreateInput;

        const createdInquiry = await prisma.inquiry.create({ data: inquiryData });

        if (validatedData.inquiryType === "BOOKING") {
            const bookingData = {
                inquiryId: createdInquiry.id,
                tourId: validatedData.tourId,
                customerName: validatedData.name,
                customerEmail: validatedData.email,
                customerPhone: validatedData.phone,
                bookingDate: validatedData.preferredDate,
                amount: tour?.price ?? null,
                ...sourceData(validatedData),
            } satisfies Prisma.BookingUncheckedCreateInput;

            await prisma.booking.create({ data: bookingData });
        }

        const inquiry = await prisma.inquiry.findUnique({
            where: { id: createdInquiry.id },
            include: { tour: true, booking: true },
        });

        res.status(201).json({ success: true, data: inquiry });
    } catch (error) {
        next(error);
    }
});

router.get(
    "/",
    authenticate,
    requirePermission("VIEW_INQUIRIES"),
    async (_req, res, next) => {
        try {
            const inquiries = await prisma.inquiry.findMany({
                include: { tour: true, booking: true },
                orderBy: { createdAt: "desc" },
            });

            res.json({ success: true, data: inquiries });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    "/:id",
    authenticate,
    requirePermission("VIEW_INQUIRIES"),
    async (req, res, next) => {
        try {
            const inquiry = await prisma.inquiry.findUnique({
                where: { id: getParam(req.params.id) },
                include: { tour: true, booking: true },
            });

            if (!inquiry) {
                res.status(404).json({ success: false, message: "Inquiry not found" });
                return;
            }

            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }
);

router.patch(
    "/:id",
    authenticate,
    requirePermission("VIEW_INQUIRIES"),
    async (req, res, next) => {
        try {
            const id = getParam(req.params.id);
            normalizeInquiryBody(req.body);
            const validatedData = UpdateInquirySchema.parse(req.body);

            if (validatedData.tourId) {
                const exists = await prisma.tour.findUnique({
                    where: { id: validatedData.tourId },
                });

                if (!exists) {
                    res.status(400).json({ success: false, message: "Invalid tourId" });
                    return;
                }
            }

            await prisma.inquiry.update({
                where: { id },
                data: validatedData,
            });

            if (hasSourceUpdate(req.body)) {
                await prisma.booking.updateMany({
                    where: { inquiryId: id },
                    data: sourceData(validatedData),
                });
            }

            const inquiry = await prisma.inquiry.findUnique({
                where: { id },
                include: { tour: true, booking: true },
            });

            res.json({ success: true, data: inquiry });
        } catch (error) {
            next(error);
        }
    }
);

router.delete(
    "/:id",
    authenticate,
    requirePermission("VIEW_INQUIRIES"),
    async (req, res, next) => {
        try {
            const id = getParam(req.params.id);
            const inquiry = await prisma.inquiry.findUnique({ where: { id } });

            if (!inquiry) {
                res.status(404).json({ success: false, message: "Inquiry not found" });
                return;
            }

            await prisma.inquiry.delete({ where: { id } });
            res.json({ success: true, message: "Inquiry deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
);

export default router;

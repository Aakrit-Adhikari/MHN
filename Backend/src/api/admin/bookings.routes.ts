import type { Prisma, SourceType } from "@prisma/client";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { CreateBookingSchema, UpdateBookingSchema } from "../../types/booking.schema.js";
import { recalculateCustomerAccount } from "../../utils/customer-category.js";

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

const normalizeBookingBody = (body: Record<string, unknown>) => {
    const aliases: Record<string, string> = {
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
    };

    for (const [from, to] of Object.entries(aliases)) {
        if (body[to] === undefined && body[from] !== undefined) {
            body[to] = body[from];
        }
    }

    for (const key of [
        "inquiryId",
        "tourId",
        "customerEmail",
        "customerPhone",
        "bookingDate",
        "passengerCount",
        "amount",
        "paymentStatus",
        "notes",
        "sourceType",
        ...sourceFields,
    ]) {
        if (body[key] === '') {
            body[key] = null;
        }
    }
};

const sourceData = (data: {
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
}) => ({
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

const bookingInclude = {
    tour: true,
    inquiry: true,
    customerAccount: true,
};

const findCustomerAccountId = async (email: string | null | undefined) => {
    if (!email) return null;

    const customer = await prisma.customerAccount.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: { id: true },
    });

    return customer?.id ?? null;
};

router.get("/", authenticate, requirePermission("VIEW_BOOKINGS"), async (_req, res, next) => {
    try {
        const bookings = await prisma.booking.findMany({
            include: bookingInclude,
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        next(error);
    }
});

router.get("/:id", authenticate, requirePermission("VIEW_BOOKINGS"), async (req, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: bookingInclude,
        });

        if (!booking) {
            res.status(404).json({ success: false, message: "Booking not found" });
            return;
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
});

router.post("/", authenticate, requirePermission("VIEW_BOOKINGS"), async (req, res, next) => {
    try {
        normalizeBookingBody(req.body);
        const validatedData = CreateBookingSchema.parse(req.body);

        const tour = validatedData.tourId
            ? await prisma.tour.findUnique({ where: { id: validatedData.tourId } })
            : null;

        if (validatedData.tourId && !tour) {
            res.status(400).json({
                success: false,
                message: "Invalid tourId: The tour does not exist.",
            });
            return;
        }

        if (validatedData.inquiryId) {
            const inquiry = await prisma.inquiry.findUnique({ where: { id: validatedData.inquiryId } });

            if (!inquiry) {
                res.status(400).json({
                    success: false,
                    message: "Invalid inquiryId: The inquiry does not exist.",
                });
                return;
            }
        }

        const bookingData = {
            inquiryId: validatedData.inquiryId,
            tourId: validatedData.tourId,
            customerAccountId: await findCustomerAccountId(validatedData.customerEmail),
            customerName: validatedData.customerName,
            customerEmail: validatedData.customerEmail,
            customerPhone: validatedData.customerPhone,
            bookingDate: validatedData.bookingDate,
            passengerCount: validatedData.passengerCount,
            amount: validatedData.amount ?? tour?.price ?? null,
            currency: validatedData.currency,
            status: validatedData.status,
            paymentStatus: validatedData.paymentStatus,
            notes: validatedData.notes,
            ...sourceData(validatedData),
        } satisfies Prisma.BookingUncheckedCreateInput;

        const booking = await prisma.booking.create({
            data: bookingData,
            include: bookingInclude,
        });

        if (booking.customerAccountId) {
            await recalculateCustomerAccount(prisma, booking.customerAccountId);
        }

        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
});

router.patch("/:id", authenticate, requirePermission("VIEW_BOOKINGS"), async (req, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        normalizeBookingBody(req.body);
        const validatedData = UpdateBookingSchema.parse(req.body);
        const existingBooking = await prisma.booking.findUnique({ where: { id } });

        if (!existingBooking) {
            res.status(404).json({ success: false, message: "Booking not found" });
            return;
        }

        if (validatedData.tourId) {
            const tour = await prisma.tour.findUnique({ where: { id: validatedData.tourId } });

            if (!tour) {
                res.status(400).json({
                    success: false,
                    message: "Invalid tourId: The tour does not exist.",
                });
                return;
            }
        }

        const nextCustomerAccountId = Object.prototype.hasOwnProperty.call(validatedData, "customerEmail")
            ? await findCustomerAccountId(validatedData.customerEmail)
            : existingBooking.customerAccountId;

        const booking = await prisma.booking.update({
            where: { id },
            data: {
                ...validatedData,
                customerAccountId: nextCustomerAccountId,
            },
            include: bookingInclude,
        });

        const affectedCustomerIds = [
            existingBooking.customerAccountId,
            booking.customerAccountId,
        ].filter((customerId): customerId is string => Boolean(customerId));

        await Promise.all(
            [...new Set(affectedCustomerIds)].map((customerId) => recalculateCustomerAccount(prisma, customerId))
        );

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", authenticate, requirePermission("VIEW_BOOKINGS"), async (req, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const booking = await prisma.booking.findUnique({ where: { id } });

        if (!booking) {
            res.status(404).json({ success: false, message: "Booking not found" });
            return;
        }

        await prisma.booking.delete({ where: { id } });

        if (booking.customerAccountId) {
            await recalculateCustomerAccount(prisma, booking.customerAccountId);
        }

        res.status(200).json({ success: true, message: "Booking deleted successfully" });
    } catch (error) {
        next(error);
    }
});

export default router;

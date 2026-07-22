import type { Prisma } from "@prisma/client";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import {
    authenticateCustomer,
    type CustomerAuthenticatedRequest,
} from "../../middleware/customer-auth.middleware.js";
import { CreateBookingSchema } from "../../types/booking.schema.js";
import { recalculateCustomerAccount } from "../../utils/customer-category.js";

const router = Router();

router.use(authenticateCustomer);

router.get("/", async (req: CustomerAuthenticatedRequest, res, next) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { customerAccountId: req.customer?.id },
            include: { tour: true },
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        next(error);
    }
});

router.post("/", async (req: CustomerAuthenticatedRequest, res, next) => {
    try {
        if (!req.customer) {
            res.status(401).json({ success: false, message: "Customer login is required" });
            return;
        }

        const validatedData = CreateBookingSchema.parse({
            ...req.body,
            customerName: req.body.customerName || req.customer.name,
            customerEmail: req.body.customerEmail || req.customer.email,
            status: req.body.status || "CONFIRMED",
            paymentStatus: req.body.paymentStatus || "PENDING",
        });

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

        const bookingData = {
            customerAccountId: req.customer.id,
            tourId: validatedData.tourId,
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
            sourceType: validatedData.sourceType,
            sourceName: validatedData.sourceName,
            sourceMedium: validatedData.sourceMedium,
            campaignName: validatedData.campaignName,
            utmSource: validatedData.utmSource,
            utmMedium: validatedData.utmMedium,
            utmCampaign: validatedData.utmCampaign,
            utmTerm: validatedData.utmTerm,
            utmContent: validatedData.utmContent,
            referrerUrl: validatedData.referrerUrl,
            landingPage: validatedData.landingPage,
            sourceNote: validatedData.sourceNote,
        } satisfies Prisma.BookingUncheckedCreateInput;

        const booking = await prisma.booking.create({
            data: bookingData,
            include: { tour: true },
        });
        const customer = await recalculateCustomerAccount(prisma, req.customer.id);

        res.status(201).json({ success: true, data: { booking, customer } });
    } catch (error) {
        next(error);
    }
});

export default router;

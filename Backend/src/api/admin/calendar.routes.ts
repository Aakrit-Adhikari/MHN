import type { BookingStatus, Prisma } from "@prisma/client";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";

const router = Router();

const calendarBookingSelect = {
    id: true,
    bookingDate: true,
    passengerCount: true,
    customerName: true,
    customerPhone: true,
    customerEmail: true,
    status: true,
    amount: true,
    currency: true,
    sourceType: true,
    sourceName: true,
    notes: true,
    tour: {
        select: {
            id: true,
            slug: true,
            title: true,
        },
    },
} satisfies Prisma.BookingSelect;

const startOfUtcDay = (date: Date) => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const addUtcDays = (date: Date, days: number) => {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);
    return nextDate;
};

const parseDateParam = (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getDateRange = (query: Record<string, unknown>) => {
    if (typeof query.month === "string" && /^\d{4}-\d{2}$/.test(query.month)) {
        const [year, month] = query.month.split("-").map(Number);
        const from = new Date(Date.UTC(year, month - 1, 1));
        const to = new Date(Date.UTC(year, month, 1));
        return { from, to };
    }

    const from = parseDateParam(query.from);
    const to = parseDateParam(query.to);

    if (!from || !to) {
        return null;
    }

    return {
        from: startOfUtcDay(from),
        to: addUtcDays(startOfUtcDay(to), 1),
    };
};

const getCalendarWhere = (query: Record<string, unknown>): Prisma.BookingWhereInput | null => {
    const range = getDateRange(query);

    if (!range) {
        return null;
    }

    const where: Prisma.BookingWhereInput = {
        bookingDate: {
            gte: range.from,
            lt: range.to,
        },
    };

    if (typeof query.tourId === "string" && query.tourId.trim()) {
        where.tourId = query.tourId;
    }

    if (typeof query.status === "string" && query.status.trim()) {
        where.status = query.status as BookingStatus;
    }

    return where;
};

const toCalendarBooking = (booking: Prisma.BookingGetPayload<{ select: typeof calendarBookingSelect }>) => ({
    id: booking.id,
    bookingDate: booking.bookingDate,
    tourId: booking.tour?.id ?? null,
    tourSlug: booking.tour?.slug ?? null,
    tourTitle: booking.tour?.title ?? "Charter",
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    passengerCount: booking.passengerCount,
    status: booking.status,
    amount: booking.amount,
    currency: booking.currency,
    sourceType: booking.sourceType,
    sourceName: booking.sourceName,
    notes: booking.notes,
});

router.use(authenticate, requirePermission("VIEW_BOOKINGS"));

router.get("/bookings", async (req, res, next) => {
    try {
        const where = getCalendarWhere(req.query);

        if (!where) {
            res.status(400).json({
                success: false,
                message: "Provide either month=YYYY-MM or from=YYYY-MM-DD&to=YYYY-MM-DD",
            });
            return;
        }

        const bookings = await prisma.booking.findMany({
            where,
            select: calendarBookingSelect,
            orderBy: [{ bookingDate: "asc" }, { createdAt: "asc" }],
        });

        res.status(200).json({
            success: true,
            data: bookings.map(toCalendarBooking),
        });
    } catch (error) {
        next(error);
    }
});

router.get("/summary", async (req, res, next) => {
    try {
        const where = getCalendarWhere(req.query);

        if (!where) {
            res.status(400).json({
                success: false,
                message: "Provide either month=YYYY-MM or from=YYYY-MM-DD&to=YYYY-MM-DD",
            });
            return;
        }

        const [totalBookings, confirmed, pending, cancelled, completed, totals] = await Promise.all([
            prisma.booking.count({ where }),
            prisma.booking.count({ where: { ...where, status: "CONFIRMED" } }),
            prisma.booking.count({ where: { ...where, status: "PENDING" } }),
            prisma.booking.count({ where: { ...where, status: "CANCELLED" } }),
            prisma.booking.count({ where: { ...where, status: "COMPLETED" } }),
            prisma.booking.aggregate({
                where: {
                    ...where,
                    status: "COMPLETED",
                    paymentStatus: "PAID_IN_FULL",
                },
                _sum: {
                    passengerCount: true,
                    amount: true,
                },
            }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalBookings,
                confirmed,
                pending,
                cancelled,
                completed,
                totalPassengers: totals._sum.passengerCount ?? 0,
                totalAmount: totals._sum.amount ?? 0,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get("/tours", async (_req, res, next) => {
    try {
        const tours = await prisma.tour.findMany({
            select: {
                id: true,
                slug: true,
                title: true,
            },
            orderBy: { title: "asc" },
        });

        res.status(200).json({ success: true, data: tours });
    } catch (error) {
        next(error);
    }
});

export default router;

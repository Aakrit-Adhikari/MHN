import type { Booking, BookingStatus, Tour } from "@prisma/client";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { getCustomerCategory, isRevenueBooking } from "../../utils/customer-category.js";

const router = Router();

type BookingWithTour = Booking & { tour: Tour | null };
type CustomerDisplayCategory = "NO_BOOKING" | "NEW" | "REPEATED" | "VIP";

type CustomerRecord = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    category: CustomerDisplayCategory;
    bookingCount: number;
    totalSpent: number;
    latestBookingAt: Date | null;
    latestTourTitle: string | null;
    joinedAt: Date | null;
    authProviders: string[];
    statuses: Partial<Record<BookingStatus, number>>;
    latestBooking?: BookingWithTour;
};

const bookingTime = (booking: BookingWithTour) => (
    booking.bookingDate ?? booking.createdAt
).getTime();

const displayCategory = (bookingCount: number, totalSpent: number): CustomerDisplayCategory => {
    if (totalSpent === 0) return "NO_BOOKING";

    const category = getCustomerCategory(bookingCount, totalSpent);
    return category === "LEAD" ? "NO_BOOKING" : category;
};

const addBooking = (
    record: CustomerRecord,
    booking: BookingWithTour
) => {
    const isValueBooking = isRevenueBooking(booking);

    if (isValueBooking) {
        record.bookingCount += 1;
        record.totalSpent += booking.amount ?? 0;
    }

    record.email ||= booking.customerEmail;
    record.phone ||= booking.customerPhone;
    record.statuses[booking.status] = (record.statuses[booking.status] ?? 0) + 1;

    if (!record.latestBooking || bookingTime(booking) > bookingTime(record.latestBooking)) {
        record.latestBooking = booking;
        record.latestBookingAt = booking.bookingDate ?? booking.createdAt;
        record.latestTourTitle = booking.tour?.title ?? null;
    }
};

router.get("/", authenticate, requirePermission("VIEW_CUSTOMERS"), async (req, res, next) => {
    try {
        const category = typeof req.query.category === "string" ? req.query.category.toUpperCase() : "ALL";
        const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";
        const sort = typeof req.query.sort === "string" ? req.query.sort.toUpperCase() : "RECENT";
        const records = new Map<string, CustomerRecord>();

        const accounts = await prisma.customerAccount.findMany({
            include: {
                authProviders: { select: { provider: true } },
                bookings: {
                    include: { tour: true },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        for (const account of accounts) {
            const record: CustomerRecord = {
                id: account.id,
                name: account.name,
                email: account.email,
                phone: null,
                avatarUrl: account.avatarUrl,
                category: "NO_BOOKING",
                bookingCount: 0,
                totalSpent: 0,
                latestBookingAt: null,
                latestTourTitle: null,
                joinedAt: account.createdAt,
                authProviders: account.authProviders.map(({ provider }) => provider),
                statuses: {},
            };

            records.set(account.id, record);
            account.bookings.forEach((booking) => addBooking(record, booking));
        }

        const allCustomers = Array.from(records.values()).map((record) => ({
            ...record,
            category: displayCategory(record.bookingCount, record.totalSpent),
            latestBooking: undefined,
        }));

        const customers = allCustomers
            .filter((record) => category === "ALL" || record.category === category)
            .filter((record) => {
                if (!search) return true;

                return [record.name, record.email, record.phone, record.latestTourTitle]
                    .some((value) => value?.toLowerCase().includes(search));
            })
            .sort((left, right) => {
                if (sort === "VALUE") return right.totalSpent - left.totalSpent;
                if (sort === "BOOKINGS") return right.bookingCount - left.bookingCount;
                if (sort === "NAME") return left.name.localeCompare(right.name);

                const leftTime = left.latestBookingAt ?? left.joinedAt;
                const rightTime = right.latestBookingAt ?? right.joinedAt;
                return (rightTime?.getTime() ?? 0) - (leftTime?.getTime() ?? 0);
            });

        const repeatCustomers = allCustomers.filter((customer) => (
            customer.category === "REPEATED" || customer.category === "VIP"
        )).length;
        const customersWithBookings = allCustomers.filter((customer) => customer.totalSpent > 0).length;
        const summary = {
            totalCustomers: allCustomers.length,
            visibleCustomers: customers.length,
            noBookingCustomers: allCustomers.filter((customer) => customer.category === "NO_BOOKING").length,
            newCustomers: allCustomers.filter((customer) => customer.category === "NEW").length,
            repeatedCustomers: repeatCustomers,
            vipCustomers: allCustomers.filter((customer) => customer.category === "VIP").length,
            repeatRate: customersWithBookings ? Math.round((repeatCustomers / customersWithBookings) * 100) : 0,
            totalValue: allCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0),
        };

        res.status(200).json({ success: true, data: { customers, summary } });
    } catch (error) {
        next(error);
    }
});

export default router;

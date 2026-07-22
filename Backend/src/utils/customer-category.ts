import type { CustomerCategory, PrismaClient } from "@prisma/client";

export const isRevenueBooking = (booking: { status: string; paymentStatus: string }) => (
    booking.status === "COMPLETED" && booking.paymentStatus === "PAID_IN_FULL"
);

export const getCustomerCategory = (
    completedBookingCount: number,
    totalSpent: number
): CustomerCategory => {
    if (totalSpent > 10000) return "VIP";
    if (completedBookingCount >= 2) return "REPEATED";
    if (completedBookingCount === 1) return "NEW";
    return "LEAD";
};

export const recalculateCustomerAccount = async (
    prisma: PrismaClient,
    customerAccountId: string
) => {
    const aggregate = await prisma.booking.aggregate({
        where: {
            customerAccountId,
            status: "COMPLETED",
            paymentStatus: "PAID_IN_FULL",
        },
        _count: { _all: true },
        _sum: { amount: true },
        _max: { bookingDate: true, createdAt: true },
    });

    const totalBookings = aggregate._count._all;
    const totalSpent = aggregate._sum.amount ?? 0;
    const lastBookingAt = aggregate._max.bookingDate ?? aggregate._max.createdAt;
    const category = getCustomerCategory(totalBookings, totalSpent);

    return prisma.customerAccount.update({
        where: { id: customerAccountId },
        data: {
            category,
            totalBookings,
            totalSpent,
            lastBookingAt,
        },
    });
};

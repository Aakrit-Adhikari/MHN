import { Router } from "express";

import { prisma } from "../../config/database.js";
import {
    authenticate,
    requirePermission,
    type AuthenticatedRequest,
} from "../../middleware/auth.middleware.js";
import type { PermissionKey } from "../../config/permissions.js";

const router = Router();

type SourceRow = {
    label: string;
    sourceType: string | null;
    sourceName: string | null;
    count: number;
};

type CampaignRow = {
    name: string;
    count: number;
};

type SourceItem = {
    sourceType: string | null;
    sourceName: string | null;
    utmSource?: string | null;
};

type CampaignItem = {
    campaignName?: string | null;
    utmCampaign?: string | null;
};

const sourceTypeLabels: Record<string, string> = {
    WEBSITE: "Website",
    ADS: "Ads",
    SOCIAL: "Social",
    OTA: "OTA",
    WHATSAPP: "WhatsApp",
    PHONE: "Phone Call",
    REFERRAL: "Referral",
    WALK_IN: "Walk-in",
    MANUAL: "Manual",
    OTHER: "Other",
};

const sourceLabel = (item: SourceItem) => {
    if (item.sourceName) return item.sourceName;
    if (item.utmSource) return item.utmSource;
    if (item.sourceType) return sourceTypeLabels[item.sourceType] ?? item.sourceType;
    return "Unknown";
};

const incrementSource = (map: Map<string, SourceRow>, item: SourceItem, amount = 1) => {
    const label = sourceLabel(item);
    const key = `${item.sourceType ?? "UNKNOWN"}:${label}`;
    const current = map.get(key);

    if (current) {
        current.count += amount;
        return;
    }

    map.set(key, {
        label,
        sourceType: item.sourceType,
        sourceName: item.sourceName,
        count: amount,
    });
};

const incrementCampaign = (map: Map<string, CampaignRow>, item: CampaignItem, amount = 1) => {
    const name = item.campaignName || item.utmCampaign;
    if (!name) return;

    const current = map.get(name);

    if (current) {
        current.count += amount;
        return;
    }

    map.set(name, { name, count: amount });
};

const sortedRows = <T extends { count: number }>(rows: Iterable<T>) =>
    Array.from(rows).sort((first, second) => second.count - first.count);

const canAccess = (req: AuthenticatedRequest, permission: PermissionKey) =>
    req.user?.role === "SUPER_ADMIN" ||
    req.user?.role === "ADMIN" ||
    Boolean(req.user?.permissions.includes(permission));

type SourceSummaryAccess = {
    bookings: boolean;
    inquiries: boolean;
    revenue: boolean;
    campaigns: boolean;
};

const fullSourceSummaryAccess: SourceSummaryAccess = {
    bookings: true,
    inquiries: true,
    revenue: true,
    campaigns: true,
};

async function getSourceSummary(access = fullSourceSummaryAccess) {
    const [inquirySources, bookingSources, revenueSources, inquiryCampaigns, bookingCampaigns] = await Promise.all([
        access.inquiries ? prisma.inquiry.groupBy({
            by: ["sourceType", "sourceName", "utmSource"],
            _count: { _all: true },
        }) : Promise.resolve([]),
        access.bookings ? prisma.booking.groupBy({
            by: ["sourceType", "sourceName", "utmSource"],
            _count: { _all: true },
        }) : Promise.resolve([]),
        access.revenue ? prisma.booking.groupBy({
            by: ["sourceType", "sourceName", "utmSource"],
            where: {
                status: "COMPLETED",
                paymentStatus: "PAID_IN_FULL",
            },
            _sum: { amount: true },
        }) : Promise.resolve([]),
        access.campaigns ? prisma.inquiry.groupBy({
            by: ["campaignName", "utmCampaign"],
            _count: { _all: true },
        }) : Promise.resolve([]),
        access.campaigns ? prisma.booking.groupBy({
            by: ["campaignName", "utmCampaign"],
            _count: { _all: true },
        }) : Promise.resolve([]),
    ]);

    const bookingsBySource = new Map<string, SourceRow>();
    const inquiriesBySource = new Map<string, SourceRow>();
    const revenueBySource = new Map<string, SourceRow>();
    const topCampaigns = new Map<string, CampaignRow>();

    for (const group of inquirySources) {
        incrementSource(inquiriesBySource, group, group._count._all);
    }

    for (const group of bookingSources) {
        if (access.bookings) {
            incrementSource(bookingsBySource, group, group._count._all);
        }
    }

    for (const group of revenueSources) {
        if (group._sum.amount) incrementSource(revenueBySource, group, group._sum.amount);
    }

    for (const group of inquiryCampaigns) {
        incrementCampaign(topCampaigns, group, group._count._all);
    }

    for (const group of bookingCampaigns) {
        incrementCampaign(topCampaigns, group, group._count._all);
    }

    return {
        bookingsBySource: sortedRows(bookingsBySource.values()),
        inquiriesBySource: sortedRows(inquiriesBySource.values()),
        revenueBySource: sortedRows(revenueBySource.values()),
        topCampaigns: sortedRows(topCampaigns.values()).slice(0, 8),
    };
}

router.get("/overview", authenticate, requirePermission("VIEW_DASHBOARD"), async (req: AuthenticatedRequest, res, next) => {
    try {
        const canViewBookings = canAccess(req, "VIEW_BOOKINGS");
        const canViewInquiries = canAccess(req, "VIEW_INQUIRIES");
        const canViewTours = canAccess(req, "VIEW_TOURS");
        const canViewBlogs = canAccess(req, "VIEW_BLOGS");
        const canViewCustomers = canAccess(req, "VIEW_CUSTOMERS");
        const canViewUsers = canAccess(req, "VIEW_USERS");
        const canViewFinance = canAccess(req, "VIEW_FINANCE");
        const canViewReports = canAccess(req, "VIEW_REPORTS");

        const [tourCount, blogCount, bookingCount, inquiryCount, customerCount, userCount, recentInquiries, sourceSummary] = await Promise.all([
            canViewTours ? prisma.tour.count() : Promise.resolve(null),
            canViewBlogs ? prisma.blogPost.count() : Promise.resolve(null),
            canViewBookings ? prisma.booking.count() : Promise.resolve(null),
            canViewInquiries ? prisma.inquiry.count() : Promise.resolve(null),
            canViewCustomers ? prisma.customerAccount.count() : Promise.resolve(null),
            canViewUsers ? prisma.user.count() : Promise.resolve(null),
            canViewInquiries
                ? prisma.inquiry.findMany({
                    take: 5,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        inquiryType: true,
                        name: true,
                        email: true,
                        phone: true,
                        createdAt: true,
                    },
                })
                : Promise.resolve([]),
            getSourceSummary({
                bookings: canViewBookings,
                inquiries: canViewInquiries,
                revenue: canViewFinance,
                campaigns: canViewReports,
            }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                counts: {
                    tours: tourCount,
                    blogs: blogCount,
                    bookings: bookingCount,
                    inquiries: inquiryCount,
                    customers: customerCount,
                    users: userCount,
                },
                recentInquiries,
                sourceSummary,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get("/sources", authenticate, requirePermission("VIEW_DASHBOARD"), async (req: AuthenticatedRequest, res, next) => {
    try {
        res.status(200).json({
            success: true,
            data: await getSourceSummary({
                bookings: canAccess(req, "VIEW_BOOKINGS"),
                inquiries: canAccess(req, "VIEW_INQUIRIES"),
                revenue: canAccess(req, "VIEW_FINANCE"),
                campaigns: canAccess(req, "VIEW_REPORTS"),
            }),
        });
    } catch (error) {
        next(error);
    }
});

export default router;

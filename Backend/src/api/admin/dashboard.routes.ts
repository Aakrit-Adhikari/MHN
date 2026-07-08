import { Router } from "express";

import { prisma } from "../../config/database.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";

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

const incrementCampaign = (map: Map<string, CampaignRow>, item: SourceItem) => {
    const name = item.campaignName || item.utmCampaign;
    if (!name) return;

    const current = map.get(name);

    if (current) {
        current.count += 1;
        return;
    }

    map.set(name, { name, count: 1 });
};

const sortedRows = <T extends { count: number }>(rows: Iterable<T>) =>
    Array.from(rows).sort((first, second) => second.count - first.count);

router.get("/sources", authenticate, requirePermission("VIEW_DASHBOARD"), async (_req, res, next) => {
    try {
        const inquiries = await prisma.inquiry.findMany({
            select: {
                inquiryType: true,
                sourceType: true,
                sourceName: true,
                utmSource: true,
                campaignName: true,
                utmCampaign: true,
            },
        });
        const bookings = await prisma.booking.findMany({
            select: {
                amount: true,
                sourceType: true,
                sourceName: true,
                utmSource: true,
                campaignName: true,
                utmCampaign: true,
            },
        });

        const bookingsBySource = new Map<string, SourceRow>();
        const inquiriesBySource = new Map<string, SourceRow>();
        const revenueBySource = new Map<string, SourceRow>();
        const topCampaigns = new Map<string, CampaignRow>();

        for (const inquiry of inquiries) {
            incrementSource(inquiriesBySource, inquiry);
            incrementCampaign(topCampaigns, inquiry);
        }

        for (const booking of bookings) {
            incrementSource(bookingsBySource, booking);
            incrementCampaign(topCampaigns, booking);

            if (booking.amount) {
                incrementSource(revenueBySource, booking, booking.amount);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                bookingsBySource: sortedRows(bookingsBySource.values()),
                inquiriesBySource: sortedRows(inquiriesBySource.values()),
                revenueBySource: sortedRows(revenueBySource.values()),
                topCampaigns: sortedRows(topCampaigns.values()).slice(0, 8),
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;

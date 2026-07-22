import { Router } from "express";
import { prisma } from "../../config/database.js";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware.js";
import { replaceDressGuideSchema } from "../../types/tour-dress-guide.schema.js";

const router = Router({ mergeParams: true });

const getSlug = (params: Record<string, string | string[]>) => Array.isArray(params.slug) ? params.slug[0] : params.slug;

router.get("/", async (req, res, next) => {
    try {
        const tour = await prisma.tour.findUnique({ where: { slug: getSlug(req.params as Record<string, string | string[]>) }, select: { id: true } });
        if (!tour) {
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        const items = await prisma.tourDressGuideItem.findMany({ where: { tourId: tour.id }, orderBy: { sortOrder: "asc" } });
        res.json({ success: true, data: items });
    } catch (error) {
        next(error);
    }
});

router.put("/", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const tour = await prisma.tour.findUnique({ where: { slug: getSlug(req.params as Record<string, string | string[]>) }, select: { id: true } });
        if (!tour) {
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        const { items } = replaceDressGuideSchema.parse(req.body);
        const savedItems = await prisma.$transaction(async (tx) => {
            await tx.tourDressGuideItem.deleteMany({ where: { tourId: tour.id } });
            if (!items.length) return [];

            await tx.tourDressGuideItem.createMany({
                data: items.map((item, index) => ({ ...item, tourId: tour.id, sortOrder: index + 1 })),
            });

            return tx.tourDressGuideItem.findMany({ where: { tourId: tour.id }, orderBy: { sortOrder: "asc" } });
        });

        res.json({ success: true, data: savedItems });
    } catch (error) {
        next(error);
    }
});

export default router;

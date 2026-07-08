import { Router } from "express";
import { prisma } from "../../config/database.js";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware.js";
import { createTourFaqSchema, updateTourFaqSchema } from "../../types/tour-faq.schema.js";

const router = Router({ mergeParams: true });

const getTourBySlug = async (slug: string) => {
    return prisma.tour.findUnique({
        where: { slug },
        select: { id: true },
    });
};

const getSlugParam = (params: Record<string, string | string[]>) => {
    return Array.isArray(params.slug) ? params.slug[0] : params.slug;
};

const getNextSortOrder = async (tourId: string) => {
    const lastFaq = await prisma.tourFaq.findFirst({
        where: { tourId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
    });

    return (lastFaq?.sortOrder ?? 0) + 1;
};

const sortOrderExists = async (tourId: string, sortOrder: number, excludeFaqId?: string) => {
    const faq = await prisma.tourFaq.findFirst({
        where: {
            tourId,
            sortOrder,
            ...(excludeFaqId ? { id: { not: excludeFaqId } } : {}),
        },
        select: { id: true },
    });

    return Boolean(faq);
};

router.get("/", async (req, res, next) => {
    try {
        const slug = getSlugParam(req.params as Record<string, string | string[]>);
        const tour = await getTourBySlug(slug);

        if (!tour) {
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        const faqs = await prisma.tourFaq.findMany({
            where: { tourId: tour.id },
            orderBy: { sortOrder: "asc" },
        });

        res.status(200).json({ success: true, data: faqs });
    } catch (error) {
        next(error);
    }
});

router.post("/", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const slug = getSlugParam(req.params as Record<string, string | string[]>);
        const tour = await getTourBySlug(slug);

        if (!tour) {
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        const validatedData = createTourFaqSchema.parse(req.body);
        const sortOrder = validatedData.sortOrder ?? await getNextSortOrder(tour.id);

        if (await sortOrderExists(tour.id, sortOrder)) {
            res.status(400).json({
                success: false,
                message: `FAQ sortOrder ${sortOrder} already exists for this tour`,
            });
            return;
        }

        const faq = await prisma.tourFaq.create({
            data: {
                ...validatedData,
                sortOrder,
                tourId: tour.id,
            },
        });

        res.status(201).json({ success: true, data: faq });
    } catch (error) {
        next(error);
    }
});

router.patch("/:faqId", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const slug = getSlugParam(req.params as Record<string, string | string[]>);
        const tour = await getTourBySlug(slug);

        if (!tour) {
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        const faqId = Array.isArray(req.params.faqId) ? req.params.faqId[0] : req.params.faqId;
        const validatedData = updateTourFaqSchema.parse(req.body);

        const existingFaq = await prisma.tourFaq.findFirst({
            where: { id: faqId, tourId: tour.id },
            select: { id: true },
        });

        if (!existingFaq) {
            res.status(404).json({ success: false, message: "Tour FAQ not found" });
            return;
        }

        if (
            validatedData.sortOrder !== undefined &&
            await sortOrderExists(tour.id, validatedData.sortOrder, faqId)
        ) {
            res.status(400).json({
                success: false,
                message: `FAQ sortOrder ${validatedData.sortOrder} already exists for this tour`,
            });
            return;
        }

        const faq = await prisma.tourFaq.update({
            where: { id: faqId },
            data: validatedData,
        });

        res.status(200).json({ success: true, data: faq });
    } catch (error) {
        next(error);
    }
});

router.delete("/:faqId", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const faqId = Array.isArray(req.params.faqId) ? req.params.faqId[0] : req.params.faqId;
        await prisma.tourFaq.delete({
            where: { id: faqId },
        });

        res.status(200).json({ success: true, message: "Tour FAQ deleted successfully" });
    } catch (error) {
        next(error);
    }
});

export default router;

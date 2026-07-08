import { Router } from "express";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { prisma } from "../../config/database.js";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware.js";
import { normalizeUploadPath, uploadTourGalleryImage } from "../../middleware/upload.middleware.js";

const router = Router({ mergeParams: true });

const galleryBodySchema = z.object({
    caption: z.string().optional(),
    sortOrder: z.coerce.number().int().min(1).optional(),
});

const updateGalleryBodySchema = galleryBodySchema.partial();

const deleteOldImage = (imageUrl: string | null) => {
    if (!imageUrl) return;
    const filePath = path.join(process.cwd(), imageUrl);
    fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
            console.error("Failed to delete old gallery image:", err);
        }
    });
};

const addSortOrderToFilename = (filePath: string, sortOrder: number) => {
    const directory = path.dirname(filePath);
    const extension = path.extname(filePath);
    const baseName = path.basename(filePath, extension);
    const sortedFilePath = path.join(directory, `${sortOrder}-${baseName}${extension}`);

    fs.renameSync(filePath, sortedFilePath);
    return normalizeUploadPath(sortedFilePath);
};

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
    const lastGalleryItem = await prisma.tourGallery.findFirst({
        where: { tourId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
    });

    return (lastGalleryItem?.sortOrder ?? 0) + 1;
};

const sortOrderExists = async (tourId: string, sortOrder: number, excludeGalleryId?: string) => {
    const galleryItem = await prisma.tourGallery.findFirst({
        where: {
            tourId,
            sortOrder,
            ...(excludeGalleryId ? { id: { not: excludeGalleryId } } : {}),
        },
        select: { id: true },
    });

    return Boolean(galleryItem);
};

router.get("/", async (req, res, next) => {
    try {
        const slug = getSlugParam(req.params as Record<string, string | string[]>);
        const tour = await getTourBySlug(slug);

        if (!tour) {
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        const gallery = await prisma.tourGallery.findMany({
            where: { tourId: tour.id },
            orderBy: { sortOrder: "asc" },
        });

        res.status(200).json({ success: true, data: gallery });
    } catch (error) {
        next(error);
    }
});

router.post("/", authenticate, requireAdmin, uploadTourGalleryImage, async (req, res, next) => {
    try {
        const slug = getSlugParam(req.params as Record<string, string | string[]>);
        const tour = await getTourBySlug(slug);

        if (!tour) {
            if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ success: false, message: "Gallery image is required" });
            return;
        }

        const validatedData = galleryBodySchema.parse(req.body);
        const sortOrder = validatedData.sortOrder ?? await getNextSortOrder(tour.id);

        if (await sortOrderExists(tour.id, sortOrder)) {
            if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));
            res.status(400).json({
                success: false,
                message: `Gallery sortOrder ${sortOrder} already exists for this tour`,
            });
            return;
        }

        const imageUrl = addSortOrderToFilename(req.file.path, sortOrder);

        const galleryItem = await prisma.tourGallery.create({
            data: {
                tourId: tour.id,
                imageUrl,
                caption: validatedData.caption,
                sortOrder,
            },
        });

        res.status(201).json({ success: true, data: galleryItem });
    } catch (error) {
        if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));
        next(error);
    }
});

router.patch("/:galleryId", authenticate, requireAdmin, uploadTourGalleryImage, async (req, res, next) => {
    try {
        const slug = getSlugParam(req.params as Record<string, string | string[]>);
        const tour = await getTourBySlug(slug);

        if (!tour) {
            if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        const galleryId = Array.isArray(req.params.galleryId) ? req.params.galleryId[0] : req.params.galleryId;
        const existingGalleryItem = await prisma.tourGallery.findFirst({
            where: { id: galleryId, tourId: tour.id },
        });

        if (!existingGalleryItem) {
            if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));
            res.status(404).json({ success: false, message: "Gallery item not found" });
            return;
        }

        const validatedData = updateGalleryBodySchema.parse(req.body);
        if (
            validatedData.sortOrder !== undefined &&
            await sortOrderExists(tour.id, validatedData.sortOrder, galleryId)
        ) {
            if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));
            res.status(400).json({
                success: false,
                message: `Gallery sortOrder ${validatedData.sortOrder} already exists for this tour`,
            });
            return;
        }

        const sortedNextImageUrl = req.file
            ? addSortOrderToFilename(req.file.path, validatedData.sortOrder ?? existingGalleryItem.sortOrder)
            : undefined;

        const galleryItem = await prisma.tourGallery.update({
            where: { id: galleryId },
            data: {
                ...validatedData,
                ...(sortedNextImageUrl ? { imageUrl: sortedNextImageUrl } : {}),
            },
        });

        if (sortedNextImageUrl) {
            deleteOldImage(existingGalleryItem.imageUrl);
        }

        res.status(200).json({ success: true, data: galleryItem });
    } catch (error) {
        if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));
        next(error);
    }
});

router.delete("/:galleryId", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const galleryId = Array.isArray(req.params.galleryId) ? req.params.galleryId[0] : req.params.galleryId;
        const existingGalleryItem = await prisma.tourGallery.findUnique({
            where: { id: galleryId },
        });

        if (!existingGalleryItem) {
            res.status(404).json({ success: false, message: "Gallery item not found" });
            return;
        }

        await prisma.tourGallery.delete({
            where: { id: galleryId },
        });

        deleteOldImage(existingGalleryItem.imageUrl);

        res.status(200).json({ success: true, message: "Tour gallery item deleted successfully" });
    } catch (error) {
        next(error);
    }
});

export default router;

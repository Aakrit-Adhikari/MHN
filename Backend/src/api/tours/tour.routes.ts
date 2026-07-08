import fs from "fs";
import path from "path";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware.js";
import {
    getUploadedFile,
    normalizeUploadPath,
    uploadTourImages,
} from "../../middleware/upload.middleware.js";
import {
    createTourSchema,
    tourResponseSchema,
    updateTourSchema,
} from "../../types/tour.schema.js";

const router = Router();

const searchableFields = [
    "title",
    "slug",
    "summary",
    "description",
    "duration",
    "altitude",
    "location",
    "groupSize",
    "bestSeason",
] as const;

const tourInclude = {
    category: true,
    faqs: {
        orderBy: { sortOrder: "asc" as const },
    },
    gallery: {
        orderBy: { sortOrder: "asc" as const },
    },
};

const getParam = (value: string | string[]) => {
    return Array.isArray(value) ? value[0] : value;
};

const getTourFiles = (files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined) => ({
    coverFile: getUploadedFile(files, "coverImage") ?? getUploadedFile(files, "photo"),
    contentFile: getUploadedFile(files, "contentImage"),
});

const deleteOldImage = (imageUrl: string | null) => {
    if (!imageUrl) return;

    fs.unlink(path.join(process.cwd(), imageUrl), (err) => {
        if (err && err.code !== "ENOENT") {
            console.error("Failed to delete old image:", err);
        }
    });
};

const deleteUploadedTourFiles = (
    coverFile?: Express.Multer.File,
    contentFile?: Express.Multer.File
) => {
    if (coverFile) {
        deleteOldImage(normalizeUploadPath(coverFile.path));
    }

    if (contentFile) {
        deleteOldImage(normalizeUploadPath(contentFile.path));
    }
};

const normalizeTourBody = (body: Record<string, any>) => {
    if (body.description === undefined && typeof body.content === "string") {
        body.description = body.content;
    }

    if (body.price === undefined && body.priceFrom !== undefined) {
        body.price = body.priceFrom;
    }

    if (body.altitude === undefined && body.maxAltitude !== undefined) {
        body.altitude = body.maxAltitude;
    }

    if (body.groupSize === undefined && body.passengers !== undefined) {
        body.groupSize = body.passengers;
    }

    if (body.location === undefined && body.region !== undefined) {
        body.location = body.region;
    }

    if (typeof body.price === "string" && body.price.trim()) {
        body.price = parseInt(body.price, 10);
    }

    if (body.slug === "") {
        delete body.slug;
    }

    [
        "categoryId",
        "duration",
        "altitude",
        "location",
        "groupSize",
        "bestSeason",
        "price",
        "coverImageUrl",
        "contentImageUrl",
    ].forEach((key) => {
        if (body[key] === "") {
            body[key] = null;
        }
    });

    return body;
};

router.post("/", authenticate, requireAdmin, uploadTourImages, async (req, res, next) => {
    try {
        const validatedData = createTourSchema.parse(normalizeTourBody(req.body));
        const { coverFile, contentFile } = getTourFiles(req.files);

        const existingTour = await prisma.tour.findUnique({
            where: { slug: validatedData.slug },
        });

        if (existingTour) {
            deleteUploadedTourFiles(coverFile, contentFile);
            res.status(400).json({
                success: false,
                message: "A tour with this slug already exists.",
            });
            return;
        }

        const tour = await prisma.tour.create({
            data: {
                categoryId: validatedData.categoryId,
                title: validatedData.title,
                slug: validatedData.slug,
                summary: validatedData.summary,
                description: validatedData.description,
                duration: validatedData.duration,
                altitude: validatedData.altitude,
                location: validatedData.location,
                groupSize: validatedData.groupSize,
                bestSeason: validatedData.bestSeason,
                price: validatedData.price,
                coverImageUrl: coverFile ? normalizeUploadPath(coverFile.path) : null,
                contentImageUrl: contentFile ? normalizeUploadPath(contentFile.path) : null,
            },
            include: tourInclude,
        });

        res.status(201).json({
            success: true,
            data: tourResponseSchema.parse(tour),
        });
    } catch (error) {
        const { coverFile, contentFile } = getTourFiles(req.files);
        deleteUploadedTourFiles(coverFile, contentFile);
        next(error);
    }
});

router.get("/", async (req, res, next) => {
    try {
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
        const where = search
            ? {
                OR: searchableFields.map((field) => ({
                    [field]: { contains: search, mode: "insensitive" as const },
                })),
            }
            : undefined;

        const tours = await prisma.tour.findMany({
            where,
            include: tourInclude,
            orderBy: { createdAt: "desc" },
        });

        res.json({ success: true, data: tours });
    } catch (error) {
        next(error);
    }
});

router.get("/:slug", async (req, res, next) => {
    try {
        const tour = await prisma.tour.findUnique({
            where: { slug: getParam(req.params.slug) },
            include: tourInclude,
        });

        if (!tour) {
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        res.json({ success: true, data: tour });
    } catch (error) {
        next(error);
    }
});

router.patch("/:slug", authenticate, requireAdmin, uploadTourImages, async (req, res, next) => {
    try {
        const slug = getParam(req.params.slug);
        const { coverFile, contentFile } = getTourFiles(req.files);

        const existingTour = await prisma.tour.findUnique({
            where: { slug },
        });

        if (!existingTour) {
            deleteUploadedTourFiles(coverFile, contentFile);
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        const data: any = updateTourSchema.parse(normalizeTourBody(req.body));
        const oldCover = coverFile ? existingTour.coverImageUrl : null;
        const oldContent = contentFile ? existingTour.contentImageUrl : null;

        if (coverFile) {
            data.coverImageUrl = normalizeUploadPath(coverFile.path);
        }

        if (contentFile) {
            data.contentImageUrl = normalizeUploadPath(contentFile.path);
        }

        const tour = await prisma.tour.update({
            where: { slug },
            data,
            include: tourInclude,
        });

        deleteOldImage(oldCover);
        deleteOldImage(oldContent);

        res.json({ success: true, data: tour });
    } catch (error) {
        const { coverFile, contentFile } = getTourFiles(req.files);
        deleteUploadedTourFiles(coverFile, contentFile);
        next(error);
    }
});

router.delete("/:slug", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const slug = getParam(req.params.slug);
        const tour = await prisma.tour.findUnique({
            where: { slug },
        });

        if (!tour) {
            res.status(404).json({ success: false, message: "Tour not found" });
            return;
        }

        await prisma.tour.delete({ where: { slug } });

        deleteOldImage(tour.coverImageUrl);
        deleteOldImage(tour.contentImageUrl);

        res.json({ success: true, message: "Tour deleted successfully" });
    } catch (error) {
        next(error);
    }
});

export default router;

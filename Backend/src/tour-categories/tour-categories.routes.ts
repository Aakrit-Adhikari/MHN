import { Router } from "express";
import { prisma } from "../config/database.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import {
    createTourCategorySchema,
    updateTourCategorySchema,
} from "../types/tour-category.schema.js";

const router = Router();

router.get("/", async (_req, res, next) => {
    try {
        const categories = await prisma.tourCategory.findMany({
            orderBy: { name: "asc" },
        });

        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
});

router.get("/:slug", async (req, res, next) => {
    try {
        const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
        const category = await prisma.tourCategory.findUnique({
            where: { slug },
            include: { tours: true },
        });

        if (!category) {
            res.status(404).json({ success: false, message: "Tour category not found" });
            return;
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
});

router.post("/", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const validatedData = createTourCategorySchema.parse(req.body);

        const existingCategory = await prisma.tourCategory.findFirst({
            where: {
                OR: [
                    { name: { equals: validatedData.name, mode: "insensitive" } },
                    { slug: validatedData.slug },
                ],
            },
        });

        if (existingCategory) {
            res.status(400).json({
                success: false,
                message: "A tour category with this name or slug already exists.",
            });
            return;
        }

        const category = await prisma.tourCategory.create({
            data: validatedData,
        });

        res.status(201).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
});

router.patch("/:slug", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
        const validatedData = updateTourCategorySchema.parse(req.body);

        const categoryToUpdate = await prisma.tourCategory.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!categoryToUpdate) {
            res.status(404).json({ success: false, message: "Tour category not found" });
            return;
        }

        const existingCategory = await prisma.tourCategory.findFirst({
            where: {
                id: { not: categoryToUpdate.id },
                OR: [
                    ...(validatedData.name
                        ? [{ name: { equals: validatedData.name, mode: "insensitive" as const } }]
                        : []),
                    ...(validatedData.slug ? [{ slug: validatedData.slug }] : []),
                ],
            },
        });

        if (existingCategory) {
            res.status(400).json({
                success: false,
                message: "A tour category with this name or slug already exists.",
            });
            return;
        }

        const category = await prisma.tourCategory.update({
            where: { slug },
            data: validatedData,
        });

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
});

router.delete("/:slug", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
        const category = await prisma.tourCategory.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!category) {
            res.status(404).json({ success: false, message: "Tour category not found" });
            return;
        }

        await prisma.tourCategory.delete({
            where: { slug },
        });

        res.status(200).json({ success: true, message: "Tour category deleted successfully" });
    } catch (error) {
        next(error);
    }
});

export default router;

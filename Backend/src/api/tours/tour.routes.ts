import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../config/database';
import { createTourSchema, tourResponseSchema } from '../../types/tour.schema';
import { uploadTourImage, normalizeUploadPath } from '../../middleware/upload.middleware';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

// ─── Helper ────────────────────────────────────────────────────────────────────

/**
 * Deletes a previously uploaded file from disk.
 * Safe to call even if the file doesn't exist.
 */
const deleteOldImage = (photoUrl: string | null) => {
    if (!photoUrl) return;
    const filePath = path.join(process.cwd(), photoUrl);
    fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Failed to delete old image:', err);
        }
    });
};

// ─── POST: Create a new tour ────────────────────────────────────────────────────

router.post('/', authenticate, requireAdmin, uploadTourImage, async (req, res, next) => {
    try {
        // Multer parses form-data as strings — convert priceFrom to number
        if (req.body.priceFrom) {
            req.body.priceFrom = parseInt(req.body.priceFrom, 10);
        }

        const validatedData = createTourSchema.parse(req.body);

        const existingTour = await prisma.tour.findUnique({
            where: { slug: validatedData.slug },
        });

        if (existingTour) {
            // If a file was uploaded but we're rejecting the request, clean it up
            if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));

            res.status(400).json({
                success: false,
                message: 'A tour with this slug already exists. Please use a different title or slug.',
            });
            return;
        }

        const tour = await prisma.tour.create({
            data: {
                title: validatedData.title,
                slug: validatedData.slug,
                summary: validatedData.summary,
                content: validatedData.content,
                priceFrom: validatedData.priceFrom,
                duration: validatedData.duration,
                // Stores: "uploads/tours/photo-1234567890.jpg"
                photoUrl: req.file ? normalizeUploadPath(req.file.path) : null,
            },
        });

        const responseData = tourResponseSchema.parse(tour);

        res.status(201).json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        // If validation fails after upload, clean up the orphaned file
        if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));
        next(error);
    }
});

// ─── GET: All tours ─────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const where = search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { slug: { contains: search, mode: 'insensitive' as const } },
                    { summary: { contains: search, mode: 'insensitive' as const } },
                    { content: { contains: search, mode: 'insensitive' as const } },
                    { duration: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : undefined;

        const tours = await prisma.tour.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({ success: true, data: tours });
    } catch (error) {
        next(error);
    }
});

// ─── GET: Single tour by slug ───────────────────────────────────────────────────

router.get('/:slug', async (req, res, next) => {
    try {
        const tour = await prisma.tour.findUnique({
            where: { slug: req.params.slug },
        });

        if (!tour) {
            res.status(404).json({ success: false, message: 'Tour not found' });
            return;
        }

        res.status(200).json({ success: true, data: tour });
    } catch (error) {
        next(error);
    }
});

// ─── PATCH: Update tour by slug ─────────────────────────────────────────────────

router.patch('/:slug', authenticate, requireAdmin, uploadTourImage, async (req, res, next) => {
    try {
        const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
        let oldPhotoUrl: string | null = null;

        // Multer parses form-data as strings — convert priceFrom if present
        if (req.body.priceFrom) {
            req.body.priceFrom = parseInt(req.body.priceFrom, 10);
        }

        const dataToUpdate: any = { ...req.body };

        if (req.file) {
            // Fetch the current tour to get the old image path
            const existingTour = await prisma.tour.findUnique({ where: { slug } });

            oldPhotoUrl = existingTour?.photoUrl ?? null;
            dataToUpdate.photoUrl = normalizeUploadPath(req.file.path);
        }

        const tour = await prisma.tour.update({
            where: { slug },
            data: dataToUpdate,
        });

        // Remove the previous file only after the database points at the new image.
        if (oldPhotoUrl) {
            deleteOldImage(oldPhotoUrl);
        }

        res.status(200).json({ success: true, data: tour });
    } catch (error) {
        // Clean up uploaded file if the update failed
        if (req.file) deleteOldImage(normalizeUploadPath(req.file.path));
        next(error);
    }
});

// ─── DELETE: Delete tour by slug ────────────────────────────────────────────────

router.delete('/:slug', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
        const tour = await prisma.tour.findUnique({
            where: { slug },
        });

        if (!tour) {
            res.status(404).json({ success: false, message: 'Tour not found' });
            return;
        }

        // Delete image from disk before removing the record
        if (tour.photoUrl) {
            deleteOldImage(tour.photoUrl);
        }

        await prisma.tour.delete({
            where: { slug },
        });

        res.status(200).json({ success: true, message: 'Tour deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

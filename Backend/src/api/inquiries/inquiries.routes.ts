import { Router } from 'express';
import { prisma } from '../../config/database';
import { CreateInquirySchema } from '../../types/inquiry.schema';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

// ─── POST: Submit a new inquiry ────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
    try {
        const validatedData = CreateInquirySchema.parse(req.body);

        // Optional: Add custom logic here to ensure tourId exists if type is BOOKING
        if (validatedData.type === 'BOOKING' && !validatedData.tourId) {
            res.status(400).json({
                success: false,
                message: 'tourId is required for BOOKING inquiries',
            });
            return;
        }

        // Check if tourId is provided and if the tour exists
        if (validatedData.tourId) {
            const tourExists = await prisma.tour.findUnique({
                where: { id: validatedData.tourId },
            });

            if (!tourExists) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid tourId: The tour does not exist.',
                });
                return;
            }
        }

        const inquiry = await prisma.inquiry.create({
            data: {
                type: validatedData.type,
                name: validatedData.name,
                email: validatedData.email,
                phone: validatedData.phone,
                message: validatedData.message,
                locale: validatedData.locale,
                utmSource: validatedData.utmSource,
                utmMedium: validatedData.utmMedium,
                utmCampaign: validatedData.utmCampaign,
                tourId: validatedData.tourId,
            },
        });

        res.status(201).json({
            success: true,
            data: inquiry,
        });
    } catch (error) {
        next(error);
    }
});

// ─── GET: All inquiries ──────────────────────────────────────────────────────────

router.get('/', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const inquiries = await prisma.inquiry.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ success: true, data: inquiries });
    } catch (error) {
        next(error);
    }
});

// ─── GET: Single inquiry by ID ──────────────────────────────────────────────────

router.get('/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const inquiry = await prisma.inquiry.findUnique({
            where: { id },
            include: { tour: true },
        });

        if (!inquiry) {
            res.status(404).json({ success: false, message: 'Inquiry not found' });
            return;
        }

        res.status(200).json({ success: true, data: inquiry });
    } catch (error) {
        next(error);
    }
});

// ─── DELETE: Delete inquiry by ID ──────────────────────────────────────────────

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const inquiry = await prisma.inquiry.findUnique({
            where: { id },
        });

        if (!inquiry) {
            res.status(404).json({ success: false, message: 'Inquiry not found' });
            return;
        }

        await prisma.inquiry.delete({
            where: { id },
        });

        res.status(200).json({ success: true, message: 'Inquiry deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;

import fs from "fs";
import path from "path";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import { authenticate, requireSuperAdmin } from "../../middleware/auth.middleware.js";
import {
    normalizeUploadPath,
    uploadAlertPopupImage,
} from "../../middleware/upload.middleware.js";
import {
    createAlertPopupSchema,
    updateAlertPopupSchema,
} from "../../types/alert-popup.schema.js";

export const publicAlertPopupRouter = Router();
export const adminAlertPopupRouter = Router();

const getParam = (value: string | string[]) => {
    return Array.isArray(value) ? value[0] : value;
};

const deleteOldImage = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return;

    fs.unlink(path.join(process.cwd(), imageUrl), (err) => {
        if (err && err.code !== "ENOENT") {
            console.error("Failed to delete old alert popup image:", err);
        }
    });
};

const deleteUploadedImage = (file?: Express.Multer.File) => {
    if (file) {
        deleteOldImage(normalizeUploadPath(file.path));
    }
};

publicAlertPopupRouter.get("/", async (_req, res, next) => {
    try {
        const now = new Date();
        const popup = await prisma.alertPopup.findFirst({
            where: {
                isActive: true,
                OR: [{ startsAt: null }, { startsAt: { lte: now } }],
                AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
            },
            orderBy: { updatedAt: "desc" },
        });

        res.status(200).json({ success: true, data: popup });
    } catch (error) {
        next(error);
    }
});

adminAlertPopupRouter.use(authenticate, requireSuperAdmin);

adminAlertPopupRouter.get("/", async (_req, res, next) => {
    try {
        const popups = await prisma.alertPopup.findMany({
            orderBy: { updatedAt: "desc" },
        });

        res.status(200).json({ success: true, data: popups });
    } catch (error) {
        next(error);
    }
});

adminAlertPopupRouter.post("/", uploadAlertPopupImage, async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: "Popup image is required" });
            return;
        }

        const data = createAlertPopupSchema.parse(req.body);
        const popup = await prisma.alertPopup.create({
            data: {
                ...data,
                imageUrl: normalizeUploadPath(req.file.path),
            },
        });

        res.status(201).json({ success: true, data: popup });
    } catch (error) {
        deleteUploadedImage(req.file);
        next(error);
    }
});

adminAlertPopupRouter.patch("/:id", uploadAlertPopupImage, async (req, res, next) => {
    try {
        const id = getParam(req.params.id);
        const existingPopup = await prisma.alertPopup.findUnique({ where: { id } });

        if (!existingPopup) {
            deleteUploadedImage(req.file);
            res.status(404).json({ success: false, message: "Alert popup not found" });
            return;
        }

        const data = updateAlertPopupSchema.parse(req.body);
        const imageUrl = req.file ? normalizeUploadPath(req.file.path) : undefined;
        const popup = await prisma.alertPopup.update({
            where: { id },
            data: {
                ...data,
                ...(imageUrl ? { imageUrl } : {}),
            },
        });

        if (imageUrl) {
            deleteOldImage(existingPopup.imageUrl);
        }

        res.status(200).json({ success: true, data: popup });
    } catch (error) {
        deleteUploadedImage(req.file);
        next(error);
    }
});

adminAlertPopupRouter.delete("/:id", async (req, res, next) => {
    try {
        const id = getParam(req.params.id);
        const existingPopup = await prisma.alertPopup.findUnique({ where: { id } });

        if (!existingPopup) {
            res.status(404).json({ success: false, message: "Alert popup not found" });
            return;
        }

        await prisma.alertPopup.delete({ where: { id } });
        deleteOldImage(existingPopup.imageUrl);

        res.status(200).json({ success: true, message: "Alert popup deleted successfully" });
    } catch (error) {
        next(error);
    }
});

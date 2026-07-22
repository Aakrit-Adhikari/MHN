import fs from "fs";
import path from "path";
import { Router, type NextFunction, type Request, type Response } from "express";
import { prisma } from "../../config/database.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { normalizeUploadPath, uploadHelicopterPicture } from "../../middleware/upload.middleware.js";
import { createHelicopterSchema, updateHelicopterSchema } from "../../types/helicopters.schema.js";

export const publicHelicoptersRouter = Router();
export const adminHelicoptersRouter = Router();

const param = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

function removePicture(pictureUrl?: string | null) {
    if (!pictureUrl || /^https?:\/\//i.test(pictureUrl)) return;
    fs.unlink(path.resolve(process.cwd(), pictureUrl), (error) => {
        if (error && error.code !== "ENOENT") console.error("Failed to delete helicopter picture:", error);
    });
}

function removeUpload(file?: Express.Multer.File) {
    if (file) removePicture(normalizeUploadPath(file.path));
}

async function listHelicopters(_req: Request, res: Response, next: NextFunction) {
    try {
        const helicopters = await prisma.helicopters.findMany({ orderBy: { helicopterNumber: "asc" } });
        res.json({ success: true, data: helicopters });
    } catch (error) { next(error); }
}

async function getHelicopter(req: Request, res: Response, next: NextFunction) {
    try {
        const helicopter = await prisma.helicopters.findUnique({ where: { id: param(req.params.id) } });
        if (!helicopter) {
            res.status(404).json({ success: false, message: "Helicopter not found" });
            return;
        }
        res.json({ success: true, data: helicopter });
    } catch (error) { next(error); }
}

publicHelicoptersRouter.get("/", listHelicopters);
publicHelicoptersRouter.get("/:id", getHelicopter);
adminHelicoptersRouter.get("/", authenticate, requirePermission("VIEW_HELICOPTERS"), listHelicopters);
adminHelicoptersRouter.get("/:id", authenticate, requirePermission("VIEW_HELICOPTERS"), getHelicopter);

adminHelicoptersRouter.post("/", authenticate, requirePermission("VIEW_HELICOPTERS"), uploadHelicopterPicture, async (req, res, next) => {
    try {
        const data = createHelicopterSchema.parse(req.body);
        const pictureUrl = req.file ? normalizeUploadPath(req.file.path) : data.pictureUrl;
        if (!pictureUrl) {
            res.status(400).json({ success: false, message: "Picture is required" });
            return;
        }
        const duplicate = await prisma.helicopters.findUnique({ where: { helicopterNumber: data.helicopterNumber } });
        if (duplicate) {
            removeUpload(req.file);
            res.status(409).json({ success: false, message: "Helicopter number already exists" });
            return;
        }
        const helicopter = await prisma.helicopters.create({
            data: { helicopterNumber: data.helicopterNumber, model: data.model, pictureUrl },
        });
        res.status(201).json({ success: true, data: helicopter });
    } catch (error) { removeUpload(req.file); next(error); }
});

adminHelicoptersRouter.patch("/:id", authenticate, requirePermission("VIEW_HELICOPTERS"), uploadHelicopterPicture, async (req, res, next) => {
    try {
        const id = param(req.params.id);
        const existing = await prisma.helicopters.findUnique({ where: { id } });
        if (!existing) {
            removeUpload(req.file);
            res.status(404).json({ success: false, message: "Helicopter not found" });
            return;
        }
        const data = updateHelicopterSchema.parse(req.body);
        if (data.helicopterNumber && data.helicopterNumber !== existing.helicopterNumber) {
            const duplicate = await prisma.helicopters.findUnique({ where: { helicopterNumber: data.helicopterNumber } });
            if (duplicate) {
                removeUpload(req.file);
                res.status(409).json({ success: false, message: "Helicopter number already exists" });
                return;
            }
        }
        const pictureUrl = req.file ? normalizeUploadPath(req.file.path) : data.pictureUrl;
        const helicopter = await prisma.helicopters.update({ where: { id }, data: { ...data, ...(pictureUrl ? { pictureUrl } : {}) } });
        if (req.file) removePicture(existing.pictureUrl);
        res.json({ success: true, data: helicopter });
    } catch (error) { removeUpload(req.file); next(error); }
});

adminHelicoptersRouter.delete("/:id", authenticate, requirePermission("VIEW_HELICOPTERS"), async (req, res, next) => {
    try {
        const id = param(req.params.id);
        const existing = await prisma.helicopters.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: "Helicopter not found" });
            return;
        }
        await prisma.helicopters.delete({ where: { id } });
        removePicture(existing.pictureUrl);
        res.json({ success: true, message: "Helicopter deleted successfully" });
    } catch (error) { next(error); }
});

import { Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../../config/database";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";
import { normalizeUploadPath, uploadBlogCoverImage } from "../../middleware/upload.middleware";
import {
    createBlogPostSchema,
    partialBlogPostSchema,
    updateBlogPostSchema,
} from "../../types/blog.schema";

export const publicBlogRouter = Router();
export const adminBlogRouter = Router();

const deleteOldCoverImage = (coverImageUrl: string | null) => {
    if (!coverImageUrl) return;

    const filePath = path.join(process.cwd(), coverImageUrl);
    fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
            console.error("Failed to delete old blog cover image:", err);
        }
    });
};

publicBlogRouter.get("/", async (_req, res, next) => {
    try {
        const blogPosts = await prisma.blogPost.findMany({
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ success: true, data: blogPosts });
    } catch (error) {
        next(error);
    }
});

publicBlogRouter.get("/:id", async (req, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const blogPost = await prisma.blogPost.findUnique({
            where: { id },
        });

        if (!blogPost) {
            res.status(404).json({ success: false, message: "Blog post not found" });
            return;
        }

        res.status(200).json({ success: true, data: blogPost });
    } catch (error) {
        next(error);
    }
});

adminBlogRouter.post(
    "/",
    authenticate,
    requireAdmin,
    uploadBlogCoverImage,
    async (req, res, next) => {
        try {
            const validatedData = createBlogPostSchema.parse(req.body);

            const blogPost = await prisma.blogPost.create({
                data: {
                    title: validatedData.title,
                    content: validatedData.content,
                    coverImageUrl: req.file ? normalizeUploadPath(req.file.path) : null,
                },
            });

            res.status(201).json({ success: true, data: blogPost });
        } catch (error) {
            if (req.file) deleteOldCoverImage(normalizeUploadPath(req.file.path));
            next(error);
        }
    }
);

adminBlogRouter.get("/", authenticate, requireAdmin, async (_req, res, next) => {
    try {
        const blogPosts = await prisma.blogPost.findMany({
            orderBy: { createdAt: "desc" },
        });

        res.status(200).json({ success: true, data: blogPosts });
    } catch (error) {
        next(error);
    }
});

adminBlogRouter.get("/:id", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const blogPost = await prisma.blogPost.findUnique({
            where: { id },
        });

        if (!blogPost) {
            res.status(404).json({ success: false, message: "Blog post not found" });
            return;
        }

        res.status(200).json({ success: true, data: blogPost });
    } catch (error) {
        next(error);
    }
});

adminBlogRouter.patch(
    "/:id",
    authenticate,
    requireAdmin,
    uploadBlogCoverImage,
    async (req, res, next) => {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const existingBlogPost = await prisma.blogPost.findUnique({
                where: { id },
            });

            if (!existingBlogPost) {
                if (req.file) deleteOldCoverImage(normalizeUploadPath(req.file.path));
                res.status(404).json({ success: false, message: "Blog post not found" });
                return;
            }

            const coverImageUrl = req.file ? normalizeUploadPath(req.file.path) : undefined;
            const validatedData = coverImageUrl
                ? partialBlogPostSchema.parse(req.body)
                : updateBlogPostSchema.parse(req.body);

            const blogPost = await prisma.blogPost.update({
                where: { id },
                data: {
                    ...validatedData,
                    ...(coverImageUrl ? { coverImageUrl } : {}),
                },
            });

            if (coverImageUrl) {
                deleteOldCoverImage(existingBlogPost.coverImageUrl);
            }

            res.status(200).json({ success: true, data: blogPost });
        } catch (error) {
            if (req.file) deleteOldCoverImage(normalizeUploadPath(req.file.path));
            next(error);
        }
    }
);

adminBlogRouter.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const existingBlogPost = await prisma.blogPost.findUnique({
            where: { id },
        });

        if (!existingBlogPost) {
            res.status(404).json({ success: false, message: "Blog post not found" });
            return;
        }

        await prisma.blogPost.delete({
            where: { id },
        });

        deleteOldCoverImage(existingBlogPost.coverImageUrl);

        res.status(200).json({ success: true, message: "Blog post deleted successfully" });
    } catch (error) {
        next(error);
    }
});

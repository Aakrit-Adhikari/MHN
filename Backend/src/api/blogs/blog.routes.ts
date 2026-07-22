import fs from "fs";
import path from "path";
import { Router } from "express";

import { prisma } from "../../config/database.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { normalizeUploadPath, uploadBlogCoverImage } from "../../middleware/upload.middleware.js";
import {
    createBlogPostSchema,
    partialBlogPostSchema,
    updateBlogPostSchema,
} from "../../types/blog.schema.js";

export const publicBlogRouter = Router();
export const adminBlogRouter = Router();

const getParam = (value: string | string[]) => {
    return Array.isArray(value) ? value[0] : value;
};

const deleteOldCoverImage = (imageUrl: string | null) => {
    if (!imageUrl) return;

    fs.unlink(path.join(process.cwd(), imageUrl), (err) => {
        if (err && err.code !== "ENOENT") {
            console.error("Failed to delete old blog cover image:", err);
        }
    });
};

const deleteUploadedCoverImage = (file?: Express.Multer.File) => {
    if (file) {
        deleteOldCoverImage(normalizeUploadPath(file.path));
    }
};

const normalizeBlogBody = (body: Record<string, any>) => {
    if (body.imageUrl === undefined && body.coverImageUrl !== undefined) {
        body.imageUrl = body.coverImageUrl;
    }

    if (body.slug === "") {
        delete body.slug;
    }

    if (body.imageUrl === "") {
        body.imageUrl = null;
    }

    ["metaTitle", "metaDescription"].forEach((key) => {
        if (body[key] === "") {
            body[key] = null;
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

publicBlogRouter.get("/:slug", async (req, res, next) => {
    try {
        const blogPost = await prisma.blogPost.findUnique({
            where: { slug: getParam(req.params.slug) },
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
    requirePermission("VIEW_BLOGS"),
    uploadBlogCoverImage,
    async (req, res, next) => {
        try {
            normalizeBlogBody(req.body);
            const validatedData = createBlogPostSchema.parse(req.body);

            const existingBlogPost = await prisma.blogPost.findUnique({
                where: { slug: validatedData.slug },
                select: { id: true },
            });

            if (existingBlogPost) {
                deleteUploadedCoverImage(req.file);
                res.status(400).json({
                    success: false,
                    message: "A blog post with this slug already exists.",
                });
                return;
            }

            const blogPost = await prisma.blogPost.create({
                data: {
                    title: validatedData.title,
                    slug: validatedData.slug,
                    content: validatedData.content,
                    metaTitle: validatedData.metaTitle,
                    metaDescription: validatedData.metaDescription,
                    imageUrl: req.file
                        ? normalizeUploadPath(req.file.path)
                        : validatedData.imageUrl ?? null,
                },
            });

            res.status(201).json({ success: true, data: blogPost });
        } catch (error) {
            deleteUploadedCoverImage(req.file);
            next(error);
        }
    }
);

adminBlogRouter.get(
    "/",
    authenticate,
    requirePermission("VIEW_BLOGS"),
    async (_req, res, next) => {
        try {
            const blogPosts = await prisma.blogPost.findMany({
                orderBy: { createdAt: "desc" },
            });

            res.json({ success: true, data: blogPosts });
        } catch (error) {
            next(error);
        }
    }
);

adminBlogRouter.get(
    "/:id",
    authenticate,
    requirePermission("VIEW_BLOGS"),
    async (req, res, next) => {
        try {
            const blogPost = await prisma.blogPost.findUnique({
                where: { id: getParam(req.params.id) },
            });

            if (!blogPost) {
                res.status(404).json({ success: false, message: "Blog post not found" });
                return;
            }

            res.json({ success: true, data: blogPost });
        } catch (error) {
            next(error);
        }
    }
);

adminBlogRouter.patch(
    "/:id",
    authenticate,
    requirePermission("VIEW_BLOGS"),
    uploadBlogCoverImage,
    async (req, res, next) => {
        try {
            const id = getParam(req.params.id);
            const existingBlogPost = await prisma.blogPost.findUnique({ where: { id } });

            if (!existingBlogPost) {
                deleteUploadedCoverImage(req.file);
                res.status(404).json({ success: false, message: "Blog post not found" });
                return;
            }

            normalizeBlogBody(req.body);

            const imageUrl = req.file ? normalizeUploadPath(req.file.path) : undefined;
            const validatedData = imageUrl
                ? partialBlogPostSchema.parse(req.body)
                : updateBlogPostSchema.parse(req.body);

            if (validatedData.slug && validatedData.slug !== existingBlogPost.slug) {
                const duplicate = await prisma.blogPost.findFirst({
                    where: {
                        id: { not: id },
                        slug: validatedData.slug,
                    },
                    select: { id: true },
                });

                if (duplicate) {
                    deleteUploadedCoverImage(req.file);
                    res.status(400).json({
                        success: false,
                        message: "A blog post with this slug already exists.",
                    });
                    return;
                }
            }

            const blogPost = await prisma.blogPost.update({
                where: { id },
                data: {
                    ...validatedData,
                    ...(imageUrl ? { imageUrl } : {}),
                },
            });

            if (imageUrl) {
                deleteOldCoverImage(existingBlogPost.imageUrl);
            }

            res.json({ success: true, data: blogPost });
        } catch (error) {
            deleteUploadedCoverImage(req.file);
            next(error);
        }
    }
);

adminBlogRouter.delete(
    "/:id",
    authenticate,
    requirePermission("VIEW_BLOGS"),
    async (req, res, next) => {
        try {
            const id = getParam(req.params.id);
            const existingBlogPost = await prisma.blogPost.findUnique({ where: { id } });

            if (!existingBlogPost) {
                res.status(404).json({ success: false, message: "Blog post not found" });
                return;
            }

            await prisma.blogPost.delete({ where: { id } });
            deleteOldCoverImage(existingBlogPost.imageUrl);

            res.json({ success: true, message: "Blog post deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
);

import fs from "fs";
import multer from "multer";
import path from "path";

const maxImageFileSize = 5 * 1024 * 1024;
const tourUploadDir = "uploads/tours/";
const blogUploadDir = "uploads/blogs/";
const alertPopupUploadDir = "uploads/alert-popups/";

const ensureUploadDir = (uploadDir: string) => {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
};

ensureUploadDir(tourUploadDir);
ensureUploadDir(blogUploadDir);
ensureUploadDir(alertPopupUploadDir);

const createImageStorage = (uploadDir: string) =>
    multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
    });

const getSafeSlug = (slug: string | string[] | undefined) => {
    const value = Array.isArray(slug) ? slug[0] : slug;
    return (value || "uncategorized").replace(/[^a-zA-Z0-9-_]/g, "-");
};

const galleryStorage = multer.diskStorage({
    destination: (req, _file, cb) => {
        const uploadDir = path.join("uploads", "gallery", getSafeSlug(req.params.slug));
        ensureUploadDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
        return;
    }

    cb(new Error("Only image files are allowed!"));
};

export const uploadTourImages = multer({
    storage: createImageStorage(tourUploadDir),
    fileFilter,
    limits: { fileSize: maxImageFileSize },
}).fields([
    { name: "coverImage", maxCount: 1 },
    { name: "contentImage", maxCount: 1 },
    { name: "photo", maxCount: 1 },
]);

export const uploadTourImage = multer({
    storage: createImageStorage(tourUploadDir),
    fileFilter,
    limits: { fileSize: maxImageFileSize },
}).single("photo");

export const uploadBlogCoverImage = multer({
    storage: createImageStorage(blogUploadDir),
    fileFilter,
    limits: { fileSize: maxImageFileSize },
}).single("coverImage");

export const uploadAlertPopupImage = multer({
    storage: createImageStorage(alertPopupUploadDir),
    fileFilter,
    limits: { fileSize: maxImageFileSize },
}).single("image");

export const uploadTourGalleryImage = multer({
    storage: galleryStorage,
    fileFilter,
    limits: { fileSize: maxImageFileSize },
}).single("image");

export const normalizeUploadPath = (filePath: string) => {
    return filePath.replace(/\\/g, "/");
};

export const getUploadedFile = (
    files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
    fieldName: string
) => {
    if (!files || Array.isArray(files)) {
        return undefined;
    }

    return files[fieldName]?.[0];
};

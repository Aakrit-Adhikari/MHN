import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ensureUploadDir = (uploadDir: string) => {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
};

// Ensure the upload directories exist
const tourUploadDir = 'uploads/tours/';
const blogUploadDir = 'uploads/blogs/';

ensureUploadDir(tourUploadDir);
ensureUploadDir(blogUploadDir);

const createImageStorage = (uploadDir: string) => {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        },
    });
}

// Only allow image files
const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Export the multer middleware
export const uploadTourImage = multer({
    storage: createImageStorage(tourUploadDir),
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
}).single('photo');

export const uploadBlogCoverImage = multer({
    storage: createImageStorage(blogUploadDir),
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
}).single('coverImage');

/**
 * Normalizes a multer file path to a clean relative URL path.
 * Handles Windows backslashes and ensures forward slashes.
 *
 * Saves:  "uploads/tours/photo-1234567890.jpg"
 * Serves: "https://yourdomain.com/uploads/tours/photo-1234567890.jpg"
 */
export const normalizeUploadPath = (filePath: string): string => {
    return filePath.replace(/\\/g, '/');
};

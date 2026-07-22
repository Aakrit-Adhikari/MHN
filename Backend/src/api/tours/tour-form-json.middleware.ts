import type { RequestHandler } from "express";

const jsonFields = ["quickFacts", "observances", "flightFeels", "journey", "peaksEncountered", "includedPermits"] as const;

/** Parses JSON fields submitted through the multipart Tour form. */
export const parseTourFormJson: RequestHandler = (req, res, next) => {
    try {
        for (const field of jsonFields) {
            if (typeof req.body[field] === "string") {
                req.body[field] = JSON.parse(req.body[field]);
            }
        }

        next();
    } catch {
        res.status(400).json({ success: false, message: "Tour form contains invalid JSON." });
    }
};

ALTER TABLE "tours"
    ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
    ADD COLUMN IF NOT EXISTS "meta_description" TEXT;

ALTER TABLE "blogs"
    ADD COLUMN IF NOT EXISTS "meta_title" TEXT,
    ADD COLUMN IF NOT EXISTS "meta_description" TEXT;

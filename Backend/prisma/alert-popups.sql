CREATE TABLE IF NOT EXISTS "alert_popups" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_popups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "alert_popups_is_active_idx" ON "alert_popups"("is_active");

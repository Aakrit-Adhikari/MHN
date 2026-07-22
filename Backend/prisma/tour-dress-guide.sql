CREATE TABLE IF NOT EXISTS "tour_dress_guide_items" (
  "id" TEXT NOT NULL,
  "tour_id" TEXT NOT NULL,
  "layer" TEXT NOT NULL,
  "item" TEXT NOT NULL,
  "why" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tour_dress_guide_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tour_dress_guide_items_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "tour_dress_guide_items_tour_id_idx" ON "tour_dress_guide_items"("tour_id");

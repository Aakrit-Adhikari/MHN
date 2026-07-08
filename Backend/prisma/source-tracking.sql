DO $$
BEGIN
  CREATE TYPE "SourceType" AS ENUM (
    'WEBSITE',
    'ADS',
    'SOCIAL',
    'OTA',
    'WHATSAPP',
    'PHONE',
    'REFERRAL',
    'WALK_IN',
    'MANUAL',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "BookingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "source_type" "SourceType";
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "source_name" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "source_medium" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "campaign_name" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "utm_source" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "utm_medium" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "utm_campaign" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "utm_term" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "utm_content" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "referrer_url" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "landing_page" TEXT;
ALTER TABLE "inquiries" ADD COLUMN IF NOT EXISTS "source_note" TEXT;

CREATE TABLE IF NOT EXISTS "bookings" (
  "id" TEXT PRIMARY KEY,
  "inquiry_id" TEXT UNIQUE,
  "tour_id" TEXT,
  "customer_name" TEXT NOT NULL,
  "customer_email" TEXT,
  "customer_phone" TEXT,
  "booking_date" TIMESTAMP(3),
  "amount" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "source_type" "SourceType",
  "source_name" TEXT,
  "source_medium" TEXT,
  "campaign_name" TEXT,
  "utm_source" TEXT,
  "utm_medium" TEXT,
  "utm_campaign" TEXT,
  "utm_term" TEXT,
  "utm_content" TEXT,
  "referrer_url" TEXT,
  "landing_page" TEXT,
  "source_note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_inquiry_id_fkey'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_inquiry_id_fkey"
      FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_tour_id_fkey'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_tour_id_fkey"
      FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

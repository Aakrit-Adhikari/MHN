ALTER TABLE "bookings"
    ADD COLUMN IF NOT EXISTS "passenger_count" INTEGER;

CREATE INDEX IF NOT EXISTS "bookings_booking_date_idx" ON "bookings"("booking_date");
CREATE INDEX IF NOT EXISTS "bookings_tour_id_idx" ON "bookings"("tour_id");

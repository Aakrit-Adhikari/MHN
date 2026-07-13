DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NewsletterAudienceType') THEN
        CREATE TYPE "NewsletterAudienceType" AS ENUM ('ALL_SUBSCRIBERS', 'PREMIUM_USERS', 'CUSTOM');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NewsletterStatus') THEN
        CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NewsletterSendStatus') THEN
        CREATE TYPE "NewsletterSendStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "is_subscribed" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribe_token" TEXT NOT NULL,
    "unsubscribed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "newsletters" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preview_text" TEXT,
    "content_html" TEXT NOT NULL,
    "content_text" TEXT,
    "audience_type" "NewsletterAudienceType" NOT NULL DEFAULT 'ALL_SUBSCRIBERS',
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "newsletter_recipients" (
    "id" TEXT NOT NULL,
    "newsletter_id" TEXT NOT NULL,
    "subscriber_id" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" "NewsletterSendStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_recipients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_unsubscribe_token_key" ON "newsletter_subscribers"("unsubscribe_token");
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_recipients_newsletter_id_email_key" ON "newsletter_recipients"("newsletter_id", "email");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'newsletters_created_by_id_fkey'
    ) THEN
        ALTER TABLE "newsletters"
        ADD CONSTRAINT "newsletters_created_by_id_fkey"
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_recipients_newsletter_id_fkey'
    ) THEN
        ALTER TABLE "newsletter_recipients"
        ADD CONSTRAINT "newsletter_recipients_newsletter_id_fkey"
        FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_recipients_subscriber_id_fkey'
    ) THEN
        ALTER TABLE "newsletter_recipients"
        ADD CONSTRAINT "newsletter_recipients_subscriber_id_fkey"
        FOREIGN KEY ("subscriber_id") REFERENCES "newsletter_subscribers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

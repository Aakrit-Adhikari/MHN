DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCE';
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'HR';
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'OPERATIONS';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
        CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
    END IF;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

WITH generated_usernames AS (
    SELECT
        id,
        lower(
            regexp_replace(
                COALESCE(NULLIF(split_part(email, '@', 1), ''), 'admin'),
                '[^a-zA-Z0-9_]+',
                '_',
                'g'
            )
        ) AS base_username,
        row_number() OVER (
            PARTITION BY lower(
                regexp_replace(
                    COALESCE(NULLIF(split_part(email, '@', 1), ''), 'admin'),
                    '[^a-zA-Z0-9_]+',
                    '_',
                    'g'
                )
            )
            ORDER BY created_at, id
        ) AS duplicate_number
    FROM "users"
    WHERE username IS NULL OR username = ''
)
UPDATE "users"
SET username = CASE
    WHEN generated_usernames.duplicate_number = 1 THEN generated_usernames.base_username
    ELSE generated_usernames.base_username || '_' || generated_usernames.duplicate_number
END
FROM generated_usernames
WHERE "users".id = generated_usernames.id;

ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = 'users_username_key'
    ) THEN
        CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = 'permissions_key_key'
    ) THEN
        CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_permissions_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_permissions_permission_id_fkey"
        FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = 'user_permissions_user_id_permission_id_key'
    ) THEN
        CREATE UNIQUE INDEX "user_permissions_user_id_permission_id_key"
            ON "user_permissions"("user_id", "permission_id");
    END IF;
END $$;

INSERT INTO "permissions" ("id", "name", "key", "updated_at")
VALUES
    ('perm_view_dashboard', 'Dashboard', 'VIEW_DASHBOARD', CURRENT_TIMESTAMP),
    ('perm_view_bookings', 'Bookings', 'VIEW_BOOKINGS', CURRENT_TIMESTAMP),
    ('perm_view_tours', 'Tours', 'VIEW_TOURS', CURRENT_TIMESTAMP),
    ('perm_view_blogs', 'Blogs', 'VIEW_BLOGS', CURRENT_TIMESTAMP),
    ('perm_view_inquiries', 'Inquiries', 'VIEW_INQUIRIES', CURRENT_TIMESTAMP),
    ('perm_view_customers', 'Customers', 'VIEW_CUSTOMERS', CURRENT_TIMESTAMP),
    ('perm_view_finance', 'Finance', 'VIEW_FINANCE', CURRENT_TIMESTAMP),
    ('perm_view_reports', 'Reports', 'VIEW_REPORTS', CURRENT_TIMESTAMP),
    ('perm_view_navigation', 'Navigation', 'VIEW_NAVIGATION', CURRENT_TIMESTAMP),
    ('perm_view_settings', 'Settings', 'VIEW_SETTINGS', CURRENT_TIMESTAMP),
    ('perm_view_users', 'Users', 'VIEW_USERS', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET "name" = EXCLUDED."name",
    "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "user_permissions" ("id", "user_id", "permission_id")
SELECT
    'up_' || replace(users.id, '-', '_') || '_' || permissions.id,
    users.id,
    permissions.id
FROM "users" users
CROSS JOIN "permissions" permissions
WHERE users.role::text IN ('SUPER_ADMIN', 'ADMIN')
ON CONFLICT ("user_id", "permission_id") DO NOTHING;

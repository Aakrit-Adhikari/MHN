do $$
begin
  create type "CustomerCategory" as enum ('LEAD', 'NEW', 'REPEATED', 'VIP');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type "AuthProvider" as enum ('LOCAL', 'GOOGLE', 'FACEBOOK', 'APPLE');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter type "AuthProvider" add value if not exists 'APPLE';
end $$;

create table if not exists "customer_accounts" (
  "id" text primary key,
  "name" text not null,
  "email" text not null unique,
  "password_hash" text,
  "avatar_url" text,
  "category" "CustomerCategory" not null default 'LEAD',
  "total_bookings" integer not null default 0,
  "total_spent" integer not null default 0,
  "last_booking_at" timestamp(3),
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null default current_timestamp
);

create table if not exists "customer_auth_providers" (
  "id" text primary key,
  "customer_id" text not null references "customer_accounts"("id") on delete cascade on update cascade,
  "provider" "AuthProvider" not null,
  "provider_user_id" text not null,
  "provider_email" text,
  "created_at" timestamp(3) not null default current_timestamp
);

create unique index if not exists "customer_auth_providers_provider_provider_user_id_key"
  on "customer_auth_providers"("provider", "provider_user_id");

alter table "bookings"
  add column if not exists "customer_account_id" text;

do $$
begin
  alter table "bookings"
    add constraint "bookings_customer_account_id_fkey"
    foreign key ("customer_account_id")
    references "customer_accounts"("id")
    on delete set null
    on update cascade;
exception
  when duplicate_object then null;
end $$;

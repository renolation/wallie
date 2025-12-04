import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_device_tokens_platform" AS ENUM('ios', 'android', 'web');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'user');
  CREATE TYPE "public"."enum_users_currency" AS ENUM('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'KRW', 'BRL', 'MXN');
  CREATE TYPE "public"."enum_subscriptions_currency" AS ENUM('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'KRW', 'BRL', 'MXN');
  CREATE TYPE "public"."enum_subscriptions_billing_cycle" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');
  CREATE TYPE "public"."enum_subscriptions_status" AS ENUM('active', 'paused', 'cancelled', 'trial');
  CREATE TYPE "public"."enum_subscriptions_source" AS ENUM('manual', 'screenshot_import', 'email_import', 'voice_entry');
  CREATE TYPE "public"."enum_households_currency" AS ENUM('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'KRW', 'BRL', 'MXN');
  CREATE TYPE "public"."enum_household_members_role" AS ENUM('owner', 'admin', 'member');
  CREATE TYPE "public"."enum_notifications_channels" AS ENUM('push', 'email', 'in_app');
  CREATE TYPE "public"."enum_notifications_type" AS ENUM('renewal_reminder', 'price_change', 'trial_ending', 'payment_failed', 'household_invite', 'settlement_request', 'weekly_digest', 'system');
  CREATE TYPE "public"."enum_notifications_status" AS ENUM('pending', 'sent', 'failed', 'read');
  CREATE TYPE "public"."enum_notifications_priority" AS ENUM('low', 'normal', 'high');
  CREATE TYPE "public"."enum_price_records_billing_cycle" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');
  CREATE TYPE "public"."enum_price_records_source" AS ENUM('user_update', 'auto_detection', 'import');
  CREATE TABLE "users_device_tokens" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"token" varchar NOT NULL,
  	"platform" "enum_users_device_tokens_platform",
  	"last_used" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'user' NOT NULL,
  	"avatar_id" integer,
  	"currency" "enum_users_currency" DEFAULT 'USD',
  	"timezone" varchar DEFAULT 'UTC',
  	"notification_preferences_renewal_reminders" boolean DEFAULT true,
  	"notification_preferences_reminder_days_before" numeric DEFAULT 3,
  	"notification_preferences_price_change_alerts" boolean DEFAULT true,
  	"notification_preferences_weekly_digest" boolean DEFAULT false,
  	"notification_preferences_push_enabled" boolean DEFAULT true,
  	"notification_preferences_email_enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"icon" varchar,
  	"color" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscriptions_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "subscriptions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"logo_id" integer,
  	"logo_url" varchar,
  	"price" numeric NOT NULL,
  	"currency" "enum_subscriptions_currency" DEFAULT 'USD',
  	"billing_cycle" "enum_subscriptions_billing_cycle" DEFAULT 'monthly' NOT NULL,
  	"first_payment_date" timestamp(3) with time zone NOT NULL,
  	"next_payment_date" timestamp(3) with time zone,
  	"status" "enum_subscriptions_status" DEFAULT 'active',
  	"trial_end_date" timestamp(3) with time zone,
  	"category_id" integer,
  	"household_id" integer,
  	"paid_by_id" integer,
  	"website" varchar,
  	"notes" varchar,
  	"source" "enum_subscriptions_source" DEFAULT 'manual',
  	"notified_for_current_cycle" boolean DEFAULT false,
  	"auto_renew" boolean DEFAULT true,
  	"cancellation_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "households" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"avatar_id" integer,
  	"owner_id" integer,
  	"currency" "enum_households_currency" DEFAULT 'USD',
  	"invite_code" varchar,
  	"invite_code_expiry" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "household_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"household_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"role" "enum_household_members_role" DEFAULT 'member' NOT NULL,
  	"nickname" varchar,
  	"joined_at" timestamp(3) with time zone,
  	"invited_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "split_assignments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subscription_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"percentage" numeric NOT NULL,
  	"amount" numeric,
  	"is_settled" boolean DEFAULT false,
  	"settled_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "notifications_channels" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_notifications_channels",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "notifications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"type" "enum_notifications_type" NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"subscription_id" integer,
  	"household_id" integer,
  	"status" "enum_notifications_status" DEFAULT 'pending' NOT NULL,
  	"priority" "enum_notifications_priority" DEFAULT 'normal',
  	"sent_at" timestamp(3) with time zone,
  	"read_at" timestamp(3) with time zone,
  	"error" varchar,
  	"metadata" jsonb,
  	"action_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "price_records" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subscription_id" integer NOT NULL,
  	"price" numeric NOT NULL,
  	"previous_price" numeric,
  	"currency" varchar DEFAULT 'USD' NOT NULL,
  	"billing_cycle" "enum_price_records_billing_cycle",
  	"recorded_at" timestamp(3) with time zone NOT NULL,
  	"source" "enum_price_records_source" DEFAULT 'user_update',
  	"change_percentage" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"categories_id" integer,
  	"subscriptions_id" integer,
  	"households_id" integer,
  	"household_members_id" integer,
  	"split_assignments_id" integer,
  	"notifications_id" integer,
  	"price_records_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_device_tokens" ADD CONSTRAINT "users_device_tokens_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions_tags" ADD CONSTRAINT "subscriptions_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_paid_by_id_users_id_fk" FOREIGN KEY ("paid_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "households" ADD CONSTRAINT "households_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "households" ADD CONSTRAINT "households_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "household_members" ADD CONSTRAINT "household_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "household_members" ADD CONSTRAINT "household_members_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "split_assignments" ADD CONSTRAINT "split_assignments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "split_assignments" ADD CONSTRAINT "split_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notifications_channels" ADD CONSTRAINT "notifications_channels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "price_records" ADD CONSTRAINT "price_records_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscriptions_fk" FOREIGN KEY ("subscriptions_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_households_fk" FOREIGN KEY ("households_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_household_members_fk" FOREIGN KEY ("household_members_id") REFERENCES "public"."household_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_split_assignments_fk" FOREIGN KEY ("split_assignments_id") REFERENCES "public"."split_assignments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk" FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_price_records_fk" FOREIGN KEY ("price_records_id") REFERENCES "public"."price_records"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_device_tokens_order_idx" ON "users_device_tokens" USING btree ("_order");
  CREATE INDEX "users_device_tokens_parent_id_idx" ON "users_device_tokens" USING btree ("_parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "categories_name_idx" ON "categories" USING btree ("name");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "subscriptions_tags_order_idx" ON "subscriptions_tags" USING btree ("_order");
  CREATE INDEX "subscriptions_tags_parent_id_idx" ON "subscriptions_tags" USING btree ("_parent_id");
  CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");
  CREATE INDEX "subscriptions_logo_idx" ON "subscriptions" USING btree ("logo_id");
  CREATE INDEX "subscriptions_category_idx" ON "subscriptions" USING btree ("category_id");
  CREATE INDEX "subscriptions_household_idx" ON "subscriptions" USING btree ("household_id");
  CREATE INDEX "subscriptions_paid_by_idx" ON "subscriptions" USING btree ("paid_by_id");
  CREATE INDEX "subscriptions_updated_at_idx" ON "subscriptions" USING btree ("updated_at");
  CREATE INDEX "subscriptions_created_at_idx" ON "subscriptions" USING btree ("created_at");
  CREATE INDEX "households_avatar_idx" ON "households" USING btree ("avatar_id");
  CREATE INDEX "households_owner_idx" ON "households" USING btree ("owner_id");
  CREATE UNIQUE INDEX "households_invite_code_idx" ON "households" USING btree ("invite_code");
  CREATE INDEX "households_updated_at_idx" ON "households" USING btree ("updated_at");
  CREATE INDEX "households_created_at_idx" ON "households" USING btree ("created_at");
  CREATE INDEX "household_members_household_idx" ON "household_members" USING btree ("household_id");
  CREATE INDEX "household_members_user_idx" ON "household_members" USING btree ("user_id");
  CREATE INDEX "household_members_invited_by_idx" ON "household_members" USING btree ("invited_by_id");
  CREATE INDEX "household_members_updated_at_idx" ON "household_members" USING btree ("updated_at");
  CREATE INDEX "household_members_created_at_idx" ON "household_members" USING btree ("created_at");
  CREATE INDEX "split_assignments_subscription_idx" ON "split_assignments" USING btree ("subscription_id");
  CREATE INDEX "split_assignments_user_idx" ON "split_assignments" USING btree ("user_id");
  CREATE INDEX "split_assignments_updated_at_idx" ON "split_assignments" USING btree ("updated_at");
  CREATE INDEX "split_assignments_created_at_idx" ON "split_assignments" USING btree ("created_at");
  CREATE INDEX "notifications_channels_order_idx" ON "notifications_channels" USING btree ("order");
  CREATE INDEX "notifications_channels_parent_idx" ON "notifications_channels" USING btree ("parent_id");
  CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");
  CREATE INDEX "notifications_subscription_idx" ON "notifications" USING btree ("subscription_id");
  CREATE INDEX "notifications_household_idx" ON "notifications" USING btree ("household_id");
  CREATE INDEX "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at");
  CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
  CREATE INDEX "price_records_subscription_idx" ON "price_records" USING btree ("subscription_id");
  CREATE INDEX "price_records_updated_at_idx" ON "price_records" USING btree ("updated_at");
  CREATE INDEX "price_records_created_at_idx" ON "price_records" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("subscriptions_id");
  CREATE INDEX "payload_locked_documents_rels_households_id_idx" ON "payload_locked_documents_rels" USING btree ("households_id");
  CREATE INDEX "payload_locked_documents_rels_household_members_id_idx" ON "payload_locked_documents_rels" USING btree ("household_members_id");
  CREATE INDEX "payload_locked_documents_rels_split_assignments_id_idx" ON "payload_locked_documents_rels" USING btree ("split_assignments_id");
  CREATE INDEX "payload_locked_documents_rels_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("notifications_id");
  CREATE INDEX "payload_locked_documents_rels_price_records_id_idx" ON "payload_locked_documents_rels" USING btree ("price_records_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_device_tokens" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "subscriptions_tags" CASCADE;
  DROP TABLE "subscriptions" CASCADE;
  DROP TABLE "households" CASCADE;
  DROP TABLE "household_members" CASCADE;
  DROP TABLE "split_assignments" CASCADE;
  DROP TABLE "notifications_channels" CASCADE;
  DROP TABLE "notifications" CASCADE;
  DROP TABLE "price_records" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_device_tokens_platform";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_currency";
  DROP TYPE "public"."enum_subscriptions_currency";
  DROP TYPE "public"."enum_subscriptions_billing_cycle";
  DROP TYPE "public"."enum_subscriptions_status";
  DROP TYPE "public"."enum_subscriptions_source";
  DROP TYPE "public"."enum_households_currency";
  DROP TYPE "public"."enum_household_members_role";
  DROP TYPE "public"."enum_notifications_channels";
  DROP TYPE "public"."enum_notifications_type";
  DROP TYPE "public"."enum_notifications_status";
  DROP TYPE "public"."enum_notifications_priority";
  DROP TYPE "public"."enum_price_records_billing_cycle";
  DROP TYPE "public"."enum_price_records_source";`)
}

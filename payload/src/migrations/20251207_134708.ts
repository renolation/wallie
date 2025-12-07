import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_user_settings_payments_payment_methods_type" AS ENUM('credit_card', 'debit_card', 'paypal', 'bank_account', 'apple_pay', 'google_pay');
  CREATE TYPE "public"."enum_user_settings_general_theme" AS ENUM('light', 'dark', 'system');
  CREATE TYPE "public"."enum_user_settings_general_language" AS ENUM('en', 'es', 'fr', 'de', 'pt', 'ja', 'ko', 'zh-CN', 'vi');
  CREATE TYPE "public"."enum_user_settings_general_date_format" AS ENUM('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD');
  CREATE TYPE "public"."enum_user_settings_general_start_of_week" AS ENUM('sunday', 'monday');
  CREATE TABLE "user_settings_payments_payment_methods" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_user_settings_payments_payment_methods_type" NOT NULL,
  	"label" varchar NOT NULL,
  	"last_four" varchar,
  	"expiry_date" varchar,
  	"is_default" boolean DEFAULT false,
  	"provider_token" varchar
  );
  
  CREATE TABLE "user_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"account_display_name" varchar,
  	"account_bio" varchar,
  	"account_phone_number" varchar,
  	"account_two_factor_enabled" boolean DEFAULT false,
  	"notifications_payment_reminders" boolean DEFAULT true,
  	"notifications_payment_reminder_days" numeric DEFAULT 3,
  	"notifications_price_change_alerts" boolean DEFAULT true,
  	"notifications_free_trial_ending_alerts" boolean DEFAULT true,
  	"notifications_weekly_summary" boolean DEFAULT false,
  	"notifications_monthly_summary" boolean DEFAULT true,
  	"notifications_new_features" boolean DEFAULT true,
  	"notifications_email_notifications" boolean DEFAULT true,
  	"notifications_push_notifications" boolean DEFAULT true,
  	"payments_default_payment_method" varchar,
  	"payments_budget_alerts" boolean DEFAULT true,
  	"payments_budget_alert_threshold" numeric DEFAULT 80,
  	"general_theme" "enum_user_settings_general_theme" DEFAULT 'system',
  	"general_language" "enum_user_settings_general_language" DEFAULT 'en',
  	"general_date_format" "enum_user_settings_general_date_format" DEFAULT 'MM/DD/YYYY',
  	"general_start_of_week" "enum_user_settings_general_start_of_week" DEFAULT 'sunday',
  	"general_compact_view" boolean DEFAULT false,
  	"general_show_cancelled_subscriptions" boolean DEFAULT false,
  	"privacy_share_data_with_household" boolean DEFAULT true,
  	"privacy_analytics_enabled" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "user_settings_id" integer;
  ALTER TABLE "user_settings_payments_payment_methods" ADD CONSTRAINT "user_settings_payments_payment_methods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."user_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "user_settings_payments_payment_methods_order_idx" ON "user_settings_payments_payment_methods" USING btree ("_order");
  CREATE INDEX "user_settings_payments_payment_methods_parent_id_idx" ON "user_settings_payments_payment_methods" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "user_settings_user_idx" ON "user_settings" USING btree ("user_id");
  CREATE INDEX "user_settings_updated_at_idx" ON "user_settings" USING btree ("updated_at");
  CREATE INDEX "user_settings_created_at_idx" ON "user_settings" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_settings_fk" FOREIGN KEY ("user_settings_id") REFERENCES "public"."user_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_user_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("user_settings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "user_settings_payments_payment_methods" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "user_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "user_settings_payments_payment_methods" CASCADE;
  DROP TABLE "user_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_user_settings_fk";
  
  DROP INDEX "payload_locked_documents_rels_user_settings_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "user_settings_id";
  DROP TYPE "public"."enum_user_settings_payments_payment_methods_type";
  DROP TYPE "public"."enum_user_settings_general_theme";
  DROP TYPE "public"."enum_user_settings_general_language";
  DROP TYPE "public"."enum_user_settings_general_date_format";
  DROP TYPE "public"."enum_user_settings_general_start_of_week";`)
}

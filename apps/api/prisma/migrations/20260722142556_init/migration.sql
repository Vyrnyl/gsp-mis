-- CreateEnum
CREATE TYPE "member_type" AS ENUM ('scout', 'adult_leader');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('female', 'male', 'other', 'undisclosed');

-- CreateEnum
CREATE TYPE "membership_state" AS ENUM ('active', 'expiring', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('registered', 'waitlisted', 'cancelled');

-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('present', 'absent', 'excused', 'late');

-- CreateEnum
CREATE TYPE "activity_report_status" AS ENUM ('submitted', 'reviewed');

-- CreateEnum
CREATE TYPE "member_badge_status" AS ENUM ('in_progress', 'earned', 'verified');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'bank_transfer', 'gcash', 'cheque');

-- CreateEnum
CREATE TYPE "report_format" AS ENUM ('pdf', 'excel');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone_number" TEXT,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "councils" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "councils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "troops" (
    "id" UUID NOT NULL,
    "council_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "troop_code" TEXT NOT NULL,
    "leader_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "troops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_levels" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order_number" INTEGER NOT NULL,

    CONSTRAINT "scout_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "badge_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "activity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_statuses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "member_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "member_type" "member_type" NOT NULL DEFAULT 'scout',
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "birth_date" DATE,
    "gender" "gender" NOT NULL DEFAULT 'female',
    "email" TEXT,
    "phone_number" TEXT,
    "address" TEXT,
    "membership_status_id" UUID NOT NULL,
    "troop_id" UUID,
    "council_id" UUID,
    "scout_level_id" UUID,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_profiles" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "profile_photo_url" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "notes" TEXT,

    CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "renewal_date" DATE,
    "status" "membership_state" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_date" DATE NOT NULL,
    "start_time" TIME,
    "end_time" TIME,
    "location" TEXT,
    "organizer_id" UUID,
    "category_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "registered_by" UUID,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "registration_status" NOT NULL DEFAULT 'registered',

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "attendance_status" "attendance_status" NOT NULL,
    "recorded_by" UUID,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_summaries" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "total_expected" INTEGER NOT NULL,
    "total_present" INTEGER NOT NULL,
    "total_absent" INTEGER NOT NULL,
    "attendance_rate" DECIMAL(5,2) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_reports" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "participation_notes" TEXT,
    "outcomes" TEXT,
    "status" "activity_report_status" NOT NULL DEFAULT 'submitted',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "activity_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" UUID,
    "required_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_requirements" (
    "id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "requirement_name" TEXT NOT NULL,
    "requirement_description" TEXT,

    CONSTRAINT "badge_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_badges" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMP(3),
    "verified_by" UUID,
    "status" "member_badge_status" NOT NULL DEFAULT 'in_progress',

    CONSTRAINT "member_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_records" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "achievement_name" TEXT NOT NULL,
    "description" TEXT,
    "achieved_at" TIMESTAMP(3) NOT NULL,
    "recorded_by" UUID,

    CONSTRAINT "achievement_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,

    CONSTRAINT "fee_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "fee_type_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "payment_method" "payment_method" NOT NULL DEFAULT 'cash',
    "received_by" UUID,
    "status" "payment_status" NOT NULL DEFAULT 'paid',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "category" TEXT,
    "approved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_periods" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_income" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_expense" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "financial_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_summaries" (
    "id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "summary_type" TEXT NOT NULL,
    "summary_value" DECIMAL(14,2) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "generated_by" UUID,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_path" TEXT,
    "format" "report_format" NOT NULL DEFAULT 'pdf',

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "template_json" JSONB NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" UUID NOT NULL,
    "metric_name" TEXT NOT NULL,
    "metric_value" DECIMAL(14,2) NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_posts" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "posted_by" UUID,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "announcement_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "councils_name_key" ON "councils"("name");

-- CreateIndex
CREATE UNIQUE INDEX "troops_troop_code_key" ON "troops"("troop_code");

-- CreateIndex
CREATE INDEX "troops_council_id_idx" ON "troops"("council_id");

-- CreateIndex
CREATE INDEX "troops_leader_id_idx" ON "troops"("leader_id");

-- CreateIndex
CREATE UNIQUE INDEX "scout_levels_name_key" ON "scout_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "badge_categories_name_key" ON "badge_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "activity_categories_name_key" ON "activity_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "member_statuses_name_key" ON "member_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_troop_id_idx" ON "members"("troop_id");

-- CreateIndex
CREATE INDEX "members_membership_status_id_idx" ON "members"("membership_status_id");

-- CreateIndex
CREATE INDEX "members_council_id_idx" ON "members"("council_id");

-- CreateIndex
CREATE INDEX "members_last_name_first_name_idx" ON "members"("last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_member_id_key" ON "member_profiles"("member_id");

-- CreateIndex
CREATE INDEX "memberships_member_id_idx" ON "memberships"("member_id");

-- CreateIndex
CREATE INDEX "memberships_end_date_idx" ON "memberships"("end_date");

-- CreateIndex
CREATE INDEX "events_event_date_idx" ON "events"("event_date");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_event_id_member_id_key" ON "event_registrations"("event_id", "member_id");

-- CreateIndex
CREATE INDEX "attendance_records_event_id_idx" ON "attendance_records"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_event_id_member_id_key" ON "attendance_records"("event_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_summaries_event_id_key" ON "attendance_summaries"("event_id");

-- CreateIndex
CREATE INDEX "activity_reports_event_id_idx" ON "activity_reports"("event_id");

-- CreateIndex
CREATE INDEX "activity_reports_submitted_by_idx" ON "activity_reports"("submitted_by");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE INDEX "badges_category_id_idx" ON "badges"("category_id");

-- CreateIndex
CREATE INDEX "badge_requirements_badge_id_idx" ON "badge_requirements"("badge_id");

-- CreateIndex
CREATE INDEX "member_badges_member_id_idx" ON "member_badges"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_badges_member_id_badge_id_key" ON "member_badges"("member_id", "badge_id");

-- CreateIndex
CREATE INDEX "achievement_records_member_id_idx" ON "achievement_records"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_types_name_key" ON "fee_types"("name");

-- CreateIndex
CREATE INDEX "payments_member_id_idx" ON "payments"("member_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE UNIQUE INDEX "financial_periods_name_key" ON "financial_periods"("name");

-- CreateIndex
CREATE INDEX "financial_summaries_period_id_idx" ON "financial_summaries"("period_id");

-- CreateIndex
CREATE INDEX "reports_report_type_idx" ON "reports"("report_type");

-- CreateIndex
CREATE UNIQUE INDEX "report_templates_name_key" ON "report_templates"("name");

-- CreateIndex
CREATE INDEX "analytics_snapshots_snapshot_date_idx" ON "analytics_snapshots"("snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_metric_name_snapshot_date_key" ON "analytics_snapshots"("metric_name", "snapshot_date");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "announcement_posts_posted_at_idx" ON "announcement_posts"("posted_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "troops" ADD CONSTRAINT "troops_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "councils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "troops" ADD CONSTRAINT "troops_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_membership_status_id_fkey" FOREIGN KEY ("membership_status_id") REFERENCES "member_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_troop_id_fkey" FOREIGN KEY ("troop_id") REFERENCES "troops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "councils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_scout_level_id_fkey" FOREIGN KEY ("scout_level_id") REFERENCES "scout_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "activity_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_summaries" ADD CONSTRAINT "attendance_summaries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_reports" ADD CONSTRAINT "activity_reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_reports" ADD CONSTRAINT "activity_reports_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "badge_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_requirements" ADD CONSTRAINT "badge_requirements_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_badges" ADD CONSTRAINT "member_badges_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_badges" ADD CONSTRAINT "member_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_badges" ADD CONSTRAINT "member_badges_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_records" ADD CONSTRAINT "achievement_records_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_records" ADD CONSTRAINT "achievement_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_fee_type_id_fkey" FOREIGN KEY ("fee_type_id") REFERENCES "fee_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_summaries" ADD CONSTRAINT "financial_summaries_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "financial_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_posts" ADD CONSTRAINT "announcement_posts_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

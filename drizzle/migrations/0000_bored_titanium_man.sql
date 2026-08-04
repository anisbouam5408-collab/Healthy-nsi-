CREATE TYPE "public"."ai_feedback_rating" AS ENUM('up', 'down');--> statement-breakpoint
CREATE TYPE "public"."ai_request_type" AS ENUM('plan_draft', 'note_summary', 'recipe_substitution', 'nutrient_gap_analysis', 'lab_document_parse');--> statement-breakpoint
CREATE TYPE "public"."ai_review_status" AS ENUM('pending', 'approved', 'edited_then_approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."appointment_location_type" AS ENUM('in_person', 'remote');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('initial', 'follow_up', 'group_session');--> statement-breakpoint
CREATE TYPE "public"."attachment_visibility" AS ENUM('practitioner_only', 'shared_with_client');--> statement-breakpoint
CREATE TYPE "public"."automation_action_type" AS ENUM('create_task', 'send_reminder');--> statement-breakpoint
CREATE TYPE "public"."care_team_access_level" AS ENUM('full', 'read_only');--> statement-breakpoint
CREATE TYPE "public"."care_team_role" AS ENUM('primary', 'secondary', 'supervising');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('lead', 'active', 'on_hold', 'completed', 'churned', 'archived');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('portal_access', 'photo_marketing_use', 'data_processing', 'telehealth');--> statement-breakpoint
CREATE TYPE "public"."credential_verification_status" AS ENUM('pending', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."custom_field_type" AS ENUM('text', 'number', 'date', 'select', 'multiselect', 'boolean');--> statement-breakpoint
CREATE TYPE "public"."dietary_restriction_type" AS ENUM('medical_allergy', 'intolerance', 'medical_therapeutic_diet', 'religious', 'ethical', 'preference');--> statement-breakpoint
CREATE TYPE "public"."food_source_type" AS ENUM('usda', 'open_food_facts', 'ciqual', 'org_custom', 'practitioner_custom');--> statement-breakpoint
CREATE TYPE "public"."generated_document_type" AS ENUM('meal_plan_pdf', 'progress_report', 'invoice');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('active', 'achieved', 'abandoned', 'revised');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('target_metric', 'behavior', 'clinical_marker', 'performance');--> statement-breakpoint
CREATE TYPE "public"."import_job_status" AS ENUM('pending', 'processing', 'completed', 'completed_with_errors', 'failed');--> statement-breakpoint
CREATE TYPE "public"."medical_condition_status" AS ENUM('active', 'managed', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."metric_category" AS ENUM('body_measurement', 'lab_result', 'vital_sign', 'behavioral', 'custom');--> statement-breakpoint
CREATE TYPE "public"."metric_entry_source" AS ENUM('manual_entry', 'document_upload', 'device_sync', 'ai_extracted');--> statement-breakpoint
CREATE TYPE "public"."note_block_type" AS ENUM('subjective', 'objective', 'assessment', 'plan', 'freeform', 'addendum');--> statement-breakpoint
CREATE TYPE "public"."note_status" AS ENUM('draft', 'finalized');--> statement-breakpoint
CREATE TYPE "public"."nutrient_category" AS ENUM('macro', 'micro', 'other');--> statement-breakpoint
CREATE TYPE "public"."org_member_role" AS ENUM('owner', 'admin', 'practitioner', 'assistant', 'student');--> statement-breakpoint
CREATE TYPE "public"."polymorphic_entity_type" AS ENUM('client', 'program', 'recipe', 'consultation_note', 'metric_entry', 'goal', 'appointment', 'lab_panel');--> statement-breakpoint
CREATE TYPE "public"."program_duration_model" AS ENUM('fixed_calendar', 'cyclical');--> statement-breakpoint
CREATE TYPE "public"."program_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."provenance_origin" AS ENUM('human', 'ai_generated', 'ai_generated_edited');--> statement-breakpoint
CREATE TYPE "public"."reminder_channel" AS ENUM('push', 'email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."restriction_severity" AS ENUM('mild', 'moderate', 'severe', 'anaphylaxis');--> statement-breakpoint
CREATE TYPE "public"."sex_assigned_at_birth" AS ENUM('female', 'male', 'intersex', 'unspecified');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."template_provenance" AS ENUM('personal', 'org_shared', 'platform_curated', 'marketplace');--> statement-breakpoint
CREATE TYPE "public"."text_extraction_status" AS ENUM('not_applicable', 'pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."unit_system" AS ENUM('metric', 'imperial');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('self_reported', 'practitioner_confirmed', 'lab_confirmed');--> statement-breakpoint
CREATE TYPE "public"."virus_scan_status" AS ENUM('pending', 'clean', 'infected', 'error');--> statement-breakpoint
CREATE TABLE "credential_verifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_type" text NOT NULL,
	"issuing_body" text,
	"license_number" text,
	"status" "credential_verification_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credential_verifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "org_member_role" NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_org_user_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"region" text DEFAULT 'eu' NOT NULL,
	"locale_default" text DEFAULT 'en' NOT NULL,
	"unit_system_default" "unit_system" DEFAULT 'metric' NOT NULL,
	"branding_tokens" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "practitioner_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"bio" text,
	"specialties" text[] DEFAULT '{}'::text[] NOT NULL,
	"public_slug" text,
	"is_publicly_listed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practitioner_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "practitioner_profiles_public_slug_unique" UNIQUE("public_slug")
);
--> statement-breakpoint
ALTER TABLE "practitioner_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"locale_preference" text DEFAULT 'en' NOT NULL,
	"unit_system_preference" "unit_system" DEFAULT 'metric' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "care_team_assignments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "care_team_role" DEFAULT 'primary' NOT NULL,
	"access_level" "care_team_access_level" DEFAULT 'full' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "care_team_assignments_client_user_unique" UNIQUE("client_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "care_team_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "client_portal_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"email" text NOT NULL,
	"invited_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_portal_accounts_client_id_unique" UNIQUE("client_id"),
	CONSTRAINT "client_portal_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "client_portal_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"household_id" uuid,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"preferred_name" text,
	"date_of_birth" date,
	"sex_assigned_at_birth" "sex_assigned_at_birth",
	"gender_identity" text,
	"email" text,
	"phone" text,
	"status" "client_status" DEFAULT 'lead' NOT NULL,
	"acquisition_source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "guardian_relationships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"minor_client_id" uuid NOT NULL,
	"guardian_name" text NOT NULL,
	"guardian_email" text,
	"guardian_phone" text,
	"has_consent_authority" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guardian_relationships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "households" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dietary_restrictions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"restriction_type" "dietary_restriction_type" NOT NULL,
	"label" text NOT NULL,
	"severity" "restriction_severity" DEFAULT 'moderate' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'self_reported' NOT NULL,
	"reaction_notes" text,
	"identified_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dietary_restrictions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "family_medical_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"relation" text NOT NULL,
	"condition" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "family_medical_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "medical_conditions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icd10_code" text,
	"status" "medical_condition_status" DEFAULT 'active' NOT NULL,
	"diagnosed_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medical_conditions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"dosage" text,
	"frequency" text,
	"prescribing_provider" text,
	"start_date" date,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "surgeries_procedures" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "surgeries_procedures" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lab_panels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"panel_name" text NOT NULL,
	"panel_date" date NOT NULL,
	"ordering_provider" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_panels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "metric_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"category" "metric_category" NOT NULL,
	"canonical_unit" text NOT NULL,
	"is_system_defined" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metric_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "metric_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"metric_definition_id" uuid NOT NULL,
	"lab_panel_id" uuid,
	"value" numeric(12, 4) NOT NULL,
	"unit" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"recorded_by_user_id" uuid,
	"source" "metric_entry_source" DEFAULT 'manual_entry' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "metric_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "metric_reference_ranges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"metric_definition_id" uuid NOT NULL,
	"population_filter" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"low" numeric(12, 4),
	"high" numeric(12, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"goal_type" "goal_type" NOT NULL,
	"target_metric_definition_id" uuid NOT NULL,
	"target_value" numeric(12, 4) NOT NULL,
	"start_date" date NOT NULL,
	"target_date" date,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"practitioner_user_id" uuid NOT NULL,
	"type" "appointment_type" DEFAULT 'follow_up' NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"location_type" "appointment_location_type" DEFAULT 'in_person' NOT NULL,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consultation_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"appointment_id" uuid,
	"author_user_id" uuid NOT NULL,
	"status" "note_status" DEFAULT 'draft' NOT NULL,
	"finalized_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "consultation_notes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "note_blocks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"consultation_note_id" uuid NOT NULL,
	"block_type" "note_block_type" NOT NULL,
	"content" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "note_blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"trigger_type" text NOT NULL,
	"condition_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"action_type" "automation_action_type" NOT NULL,
	"action_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automation_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"channel" "reminder_channel" DEFAULT 'push' NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"recurrence_rule" text,
	"source_automation_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"assignee_user_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"due_date" date,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"related_entity_type" "polymorphic_entity_type",
	"related_entity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "food_nutrient_values" (
	"id" uuid PRIMARY KEY NOT NULL,
	"food_id" uuid NOT NULL,
	"nutrient_id" uuid NOT NULL,
	"amount_per_100g" numeric(12, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_nutrient_values_food_nutrient_unique" UNIQUE("food_id","nutrient_id")
);
--> statement-breakpoint
ALTER TABLE "food_nutrient_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "food_sources" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" "food_source_type" NOT NULL,
	"name" text NOT NULL,
	"data_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_translations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"food_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_translations_food_locale_unique" UNIQUE("food_id","locale")
);
--> statement-breakpoint
ALTER TABLE "food_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "food_units" (
	"id" uuid PRIMARY KEY NOT NULL,
	"food_id" uuid NOT NULL,
	"label" text NOT NULL,
	"gram_equivalent" numeric(12, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_units" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"source_id" uuid NOT NULL,
	"external_id" text,
	"name" text NOT NULL,
	"category" text,
	"is_branded" boolean DEFAULT false NOT NULL,
	"brand_name" text,
	"barcode" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "foods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "nutrients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"category" "nutrient_category" NOT NULL,
	"canonical_unit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nutrients_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY NOT NULL,
	"recipe_id" uuid NOT NULL,
	"food_id" uuid NOT NULL,
	"quantity" numeric(12, 4) NOT NULL,
	"unit" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"instructions" text,
	"servings" integer DEFAULT 1 NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "recipes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "meal_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"slot" text,
	"provenance" "template_provenance" DEFAULT 'personal' NOT NULL,
	"structure" jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "meal_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "program_templates" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"provenance" "template_provenance" DEFAULT 'personal' NOT NULL,
	"duration_model" "program_duration_model" DEFAULT 'fixed_calendar' NOT NULL,
	"structure" jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "program_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "meal_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meal_id" uuid NOT NULL,
	"food_id" uuid,
	"recipe_id" uuid,
	"quantity" numeric(12, 4) NOT NULL,
	"unit" text NOT NULL,
	"substitution_group_id" uuid,
	"order_index" integer DEFAULT 0 NOT NULL,
	"origin" "provenance_origin" DEFAULT 'human' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_items_exactly_one_food_or_recipe" CHECK ((food_id is not null and recipe_id is null) or (food_id is null and recipe_id is not null))
);
--> statement-breakpoint
ALTER TABLE "meal_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_day_id" uuid NOT NULL,
	"slot" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"target_time" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "program_days" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_days_program_day_unique" UNIQUE("program_id","day_number")
);
--> statement-breakpoint
ALTER TABLE "program_days" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "program_goals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_goals_program_goal_unique" UNIQUE("program_id","goal_id")
);
--> statement-breakpoint
ALTER TABLE "program_goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "program_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"sent_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_versions_program_version_unique" UNIQUE("program_id","version_number")
);
--> statement-breakpoint
ALTER TABLE "program_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"name" text NOT NULL,
	"status" "program_status" DEFAULT 'draft' NOT NULL,
	"duration_model" "program_duration_model" DEFAULT 'fixed_calendar' NOT NULL,
	"start_date" date,
	"created_from_template_id" uuid,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "programs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" "polymorphic_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"storage_key" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"uploaded_by_user_id" uuid,
	"visibility" "attachment_visibility" DEFAULT 'practitioner_only' NOT NULL,
	"virus_scan_status" "virus_scan_status" DEFAULT 'pending' NOT NULL,
	"text_extraction_status" text_extraction_status DEFAULT 'not_applicable' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "generated_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"document_type" "generated_document_type" NOT NULL,
	"source_program_version_id" uuid,
	"storage_key" text NOT NULL,
	"generated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generated_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_feedback" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"rating" "ai_feedback_rating" NOT NULL,
	"comment" text,
	"given_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_feedback_request_user_unique" UNIQUE("request_id","given_by_user_id")
);
--> statement-breakpoint
ALTER TABLE "ai_feedback" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_generation_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"client_id" uuid,
	"request_type" "ai_request_type" NOT NULL,
	"input_context" jsonb NOT NULL,
	"model_identifier" text NOT NULL,
	"raw_output" jsonb,
	"requested_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_generation_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_generation_reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"status" "ai_review_status" DEFAULT 'pending' NOT NULL,
	"reviewer_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"approved_output" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_generation_reviews_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
ALTER TABLE "ai_generation_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "custom_field_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" "polymorphic_entity_type" NOT NULL,
	"field_key" text NOT NULL,
	"label" text NOT NULL,
	"field_type" "custom_field_type" NOT NULL,
	"options" jsonb,
	"is_required" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_field_definitions_org_entity_key_unique" UNIQUE("organization_id","entity_type","field_key")
);
--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "custom_field_values" (
	"id" uuid PRIMARY KEY NOT NULL,
	"definition_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_field_values_definition_entity_unique" UNIQUE("definition_id","entity_id")
);
--> statement-breakpoint
ALTER TABLE "custom_field_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "taggings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tag_id" uuid NOT NULL,
	"entity_type" "polymorphic_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taggings_tag_entity_unique" UNIQUE("tag_id","entity_type","entity_id")
);
--> statement-breakpoint
ALTER TABLE "taggings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb,
	"ip_address" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changed_by_user_id" uuid,
	"change_reason" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "revisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"text_version" integer NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"method" text DEFAULT 'checkbox' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "credential_verifications" ADD CONSTRAINT "credential_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credential_verifications" ADD CONSTRAINT "credential_verifications_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practitioner_profiles" ADD CONSTRAINT "practitioner_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_team_assignments" ADD CONSTRAINT "care_team_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_team_assignments" ADD CONSTRAINT "care_team_assignments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_team_assignments" ADD CONSTRAINT "care_team_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_portal_accounts" ADD CONSTRAINT "client_portal_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_portal_accounts" ADD CONSTRAINT "client_portal_accounts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_relationships" ADD CONSTRAINT "guardian_relationships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_relationships" ADD CONSTRAINT "guardian_relationships_minor_client_id_clients_id_fk" FOREIGN KEY ("minor_client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dietary_restrictions" ADD CONSTRAINT "dietary_restrictions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_medical_history" ADD CONSTRAINT "family_medical_history_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_conditions" ADD CONSTRAINT "medical_conditions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surgeries_procedures" ADD CONSTRAINT "surgeries_procedures_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_panels" ADD CONSTRAINT "lab_panels_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_definitions" ADD CONSTRAINT "metric_definitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_metric_definition_id_metric_definitions_id_fk" FOREIGN KEY ("metric_definition_id") REFERENCES "public"."metric_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_lab_panel_id_lab_panels_id_fk" FOREIGN KEY ("lab_panel_id") REFERENCES "public"."lab_panels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_reference_ranges" ADD CONSTRAINT "metric_reference_ranges_definition_fk" FOREIGN KEY ("metric_definition_id") REFERENCES "public"."metric_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_target_metric_definition_id_metric_definitions_id_fk" FOREIGN KEY ("target_metric_definition_id") REFERENCES "public"."metric_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_practitioner_user_id_users_id_fk" FOREIGN KEY ("practitioner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_blocks" ADD CONSTRAINT "note_blocks_consultation_note_id_consultation_notes_id_fk" FOREIGN KEY ("consultation_note_id") REFERENCES "public"."consultation_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_source_automation_rule_id_automation_rules_id_fk" FOREIGN KEY ("source_automation_rule_id") REFERENCES "public"."automation_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_nutrient_values" ADD CONSTRAINT "food_nutrient_values_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_nutrient_values" ADD CONSTRAINT "food_nutrient_values_nutrient_id_nutrients_id_fk" FOREIGN KEY ("nutrient_id") REFERENCES "public"."nutrients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_translations" ADD CONSTRAINT "food_translations_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_units" ADD CONSTRAINT "food_units_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_source_id_food_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."food_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_templates" ADD CONSTRAINT "meal_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_templates" ADD CONSTRAINT "meal_templates_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_templates" ADD CONSTRAINT "program_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_templates" ADD CONSTRAINT "program_templates_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_program_day_id_program_days_id_fk" FOREIGN KEY ("program_day_id") REFERENCES "public"."program_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_days" ADD CONSTRAINT "program_days_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_goals" ADD CONSTRAINT "program_goals_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_goals" ADD CONSTRAINT "program_goals_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_versions" ADD CONSTRAINT "program_versions_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_versions" ADD CONSTRAINT "program_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_created_from_template_id_program_templates_id_fk" FOREIGN KEY ("created_from_template_id") REFERENCES "public"."program_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_source_version_fk" FOREIGN KEY ("source_program_version_id") REFERENCES "public"."program_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_request_id_ai_generation_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."ai_generation_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_given_by_user_id_users_id_fk" FOREIGN KEY ("given_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_requests" ADD CONSTRAINT "ai_generation_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_requests" ADD CONSTRAINT "ai_generation_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_requests" ADD CONSTRAINT "ai_generation_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_reviews" ADD CONSTRAINT "ai_generation_reviews_request_id_ai_generation_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."ai_generation_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_reviews" ADD CONSTRAINT "ai_generation_reviews_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_definition_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."custom_field_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "metric_definitions_global_key_unique" ON "metric_definitions" USING btree ("key") WHERE organization_id is null;--> statement-breakpoint
CREATE UNIQUE INDEX "metric_definitions_org_key_unique" ON "metric_definitions" USING btree ("organization_id","key") WHERE organization_id is not null;--> statement-breakpoint
-- Hand-written additions (not generated by drizzle-kit): the shared
-- access-control accessors every RLS policy below calls, instead of
-- each policy calling current_setting(...) directly. Must be created
-- here — after every table they reference exists, and before the
-- first CREATE POLICY that calls them. See
-- src/lib/db/schema/_helpers.ts for the full rationale, including why
-- `nullif(..., '')` guards every accessor: Postgres connection pooling
-- reuses physical backend connections, and once a custom GUC has been
-- set at least once on a connection, an unset read on a later,
-- unrelated transaction returns an empty string, not NULL — a raw
-- `::uuid` cast on that throws instead of safely evaluating to false.
-- If the schema evolves and this migration is regenerated, re-apply
-- this same insertion by hand at the equivalent point.
CREATE FUNCTION app_current_org_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_org_id', true), '')::uuid;
$$;--> statement-breakpoint
CREATE FUNCTION app_current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;--> statement-breakpoint
CREATE FUNCTION app_is_platform_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('app.is_platform_admin', true), ''), 'false')::boolean;
$$;--> statement-breakpoint
CREATE FUNCTION app_can_access_client(p_client_id uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = p_client_id
      AND c.organization_id = app_current_org_id()
      AND (
        EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = c.organization_id
            AND om.user_id = app_current_user_id()
            AND om.role IN ('owner', 'admin')
        )
        OR EXISTS (
          SELECT 1 FROM care_team_assignments cta
          WHERE cta.client_id = c.id
            AND cta.user_id = app_current_user_id()
        )
      )
  );
$$;--> statement-breakpoint
CREATE POLICY "credential_verifications_visibility" ON "credential_verifications" AS PERMISSIVE FOR SELECT TO public USING (user_id = app_current_user_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "credential_verifications_self_submit" ON "credential_verifications" AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = app_current_user_id());--> statement-breakpoint
CREATE POLICY "credential_verifications_admin_manage" ON "credential_verifications" AS PERMISSIVE FOR ALL TO public USING (app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "organization_members_org_isolation" ON "organization_members" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or user_id = app_current_user_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "organizations_org_isolation" ON "organizations" AS PERMISSIVE FOR ALL TO public USING (id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "organizations_insert_self" ON "organizations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "practitioner_profiles_visibility" ON "practitioner_profiles" AS PERMISSIVE FOR SELECT TO public USING (
        is_publicly_listed = true
        or user_id = app_current_user_id()
        or app_is_platform_admin()
      );--> statement-breakpoint
CREATE POLICY "practitioner_profiles_modify_self_only" ON "practitioner_profiles" AS PERMISSIVE FOR INSERT TO public WITH CHECK (user_id = app_current_user_id());--> statement-breakpoint
CREATE POLICY "practitioner_profiles_update_self_only" ON "practitioner_profiles" AS PERMISSIVE FOR UPDATE TO public USING (user_id = app_current_user_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "users_visible_to_self_or_org_mates" ON "users" AS PERMISSIVE FOR SELECT TO public USING (
        id = app_current_user_id()
        or app_is_platform_admin()
        or exists (
          select 1 from organization_members me
          join organization_members them on them.organization_id = me.organization_id
          where me.user_id = app_current_user_id()
            and them.user_id = users.id
        )
      );--> statement-breakpoint
CREATE POLICY "users_modify_self_only" ON "users" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "users_update_self_only" ON "users" AS PERMISSIVE FOR UPDATE TO public USING (id = app_current_user_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "care_team_assignments_org_isolation" ON "care_team_assignments" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "client_portal_accounts_org_isolation" ON "client_portal_accounts" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "clients_care_team_scoped_access" ON "clients" AS PERMISSIVE FOR ALL TO public USING (
        app_is_platform_admin()
        or (
          organization_id = app_current_org_id()
          and (
            exists (
              select 1 from organization_members om
              where om.organization_id = clients.organization_id
                and om.user_id = app_current_user_id()
                and om.role in ('owner', 'admin')
            )
            or exists (
              select 1 from care_team_assignments cta
              where cta.client_id = clients.id
                and cta.user_id = app_current_user_id()
            )
          )
        )
      ) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "guardian_relationships_org_isolation" ON "guardian_relationships" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "households_org_isolation" ON "households" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "dietary_restrictions_client_scoped_access" ON "dietary_restrictions" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "family_medical_history_client_scoped_access" ON "family_medical_history" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "medical_conditions_client_scoped_access" ON "medical_conditions" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "medications_client_scoped_access" ON "medications" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "surgeries_procedures_client_scoped_access" ON "surgeries_procedures" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "lab_panels_client_scoped_access" ON "lab_panels" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "metric_definitions_visibility" ON "metric_definitions" AS PERMISSIVE FOR SELECT TO public USING (organization_id is null or organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "metric_definitions_org_insert" ON "metric_definitions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "metric_definitions_org_update" ON "metric_definitions" AS PERMISSIVE FOR UPDATE TO public USING (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "metric_entries_client_scoped_access" ON "metric_entries" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "goals_client_scoped_access" ON "goals" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "appointments_client_scoped_access" ON "appointments" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "consultation_notes_client_scoped_access" ON "consultation_notes" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "note_blocks_via_parent_note" ON "note_blocks" AS PERMISSIVE FOR ALL TO public USING (
        app_is_platform_admin()
        or exists (
          select 1 from consultation_notes cn
          where cn.id = note_blocks.consultation_note_id
            and app_can_access_client(cn.client_id)
        )
      ) WITH CHECK (
        exists (
          select 1 from consultation_notes cn
          where cn.id = note_blocks.consultation_note_id
            and app_can_access_client(cn.client_id)
        )
      );--> statement-breakpoint
CREATE POLICY "automation_rules_org_isolation" ON "automation_rules" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "reminders_client_scoped_access" ON "reminders" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));--> statement-breakpoint
CREATE POLICY "tasks_org_and_client_scoped" ON "tasks" AS PERMISSIVE FOR ALL TO public USING (
      app_is_platform_admin()
      or (
        organization_id = app_current_org_id()
        and (client_id is null or app_can_access_client(client_id))
      )
    ) WITH CHECK (
      organization_id = app_current_org_id()
      and (client_id is null or app_can_access_client(client_id))
    );--> statement-breakpoint
CREATE POLICY "food_nutrient_values_via_parent_food" ON "food_nutrient_values" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from foods f where f.id = food_nutrient_values.food_id));--> statement-breakpoint
CREATE POLICY "food_translations_via_parent_food" ON "food_translations" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from foods f where f.id = food_translations.food_id));--> statement-breakpoint
CREATE POLICY "food_units_via_parent_food" ON "food_units" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from foods f where f.id = food_units.food_id));--> statement-breakpoint
CREATE POLICY "foods_visibility" ON "foods" AS PERMISSIVE FOR SELECT TO public USING (organization_id is null or organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "foods_org_insert" ON "foods" AS PERMISSIVE FOR INSERT TO public WITH CHECK (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "foods_org_update" ON "foods" AS PERMISSIVE FOR UPDATE TO public USING (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "recipe_ingredients_via_parent_recipe" ON "recipe_ingredients" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from recipes r where r.id = recipe_ingredients.recipe_id));--> statement-breakpoint
CREATE POLICY "recipes_visibility" ON "recipes" AS PERMISSIVE FOR SELECT TO public USING (organization_id is null or organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "recipes_org_insert" ON "recipes" AS PERMISSIVE FOR INSERT TO public WITH CHECK (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "recipes_org_update" ON "recipes" AS PERMISSIVE FOR UPDATE TO public USING (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "meal_templates_visibility" ON "meal_templates" AS PERMISSIVE FOR SELECT TO public USING (organization_id is null or organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "meal_templates_org_insert" ON "meal_templates" AS PERMISSIVE FOR INSERT TO public WITH CHECK (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "meal_templates_org_update" ON "meal_templates" AS PERMISSIVE FOR UPDATE TO public USING (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "program_templates_visibility" ON "program_templates" AS PERMISSIVE FOR SELECT TO public USING (organization_id is null or organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "program_templates_org_insert" ON "program_templates" AS PERMISSIVE FOR INSERT TO public WITH CHECK (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "program_templates_org_update" ON "program_templates" AS PERMISSIVE FOR UPDATE TO public USING (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "meal_items_via_parent_program" ON "meal_items" AS PERMISSIVE FOR ALL TO public USING (exists (
        select 1 from meals m
        join program_days pd on pd.id = m.program_day_id
        join programs p on p.id = pd.program_id
        where m.id = meal_items.meal_id
      ));--> statement-breakpoint
CREATE POLICY "meals_via_parent_program" ON "meals" AS PERMISSIVE FOR ALL TO public USING (exists (
        select 1 from program_days pd
        join programs p on p.id = pd.program_id
        where pd.id = meals.program_day_id
      ));--> statement-breakpoint
CREATE POLICY "program_days_via_parent_program" ON "program_days" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from programs p where p.id = program_days.program_id));--> statement-breakpoint
CREATE POLICY "program_goals_via_parent_program" ON "program_goals" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from programs p where p.id = program_goals.program_id));--> statement-breakpoint
CREATE POLICY "program_versions_via_parent_program" ON "program_versions" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from programs p where p.id = program_versions.program_id));--> statement-breakpoint
CREATE POLICY "programs_org_and_client_scoped" ON "programs" AS PERMISSIVE FOR ALL TO public USING (
      app_is_platform_admin()
      or (
        organization_id = app_current_org_id()
        and (client_id is null or app_can_access_client(client_id))
      )
    ) WITH CHECK (
      organization_id = app_current_org_id()
      and (client_id is null or app_can_access_client(client_id))
    );--> statement-breakpoint
CREATE POLICY "attachments_org_isolation" ON "attachments" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "generated_documents_org_and_client_scoped" ON "generated_documents" AS PERMISSIVE FOR ALL TO public USING (
      app_is_platform_admin()
      or (
        organization_id = app_current_org_id()
        and (client_id is null or app_can_access_client(client_id))
      )
    ) WITH CHECK (
      organization_id = app_current_org_id()
      and (client_id is null or app_can_access_client(client_id))
    );--> statement-breakpoint
CREATE POLICY "ai_feedback_via_parent_request" ON "ai_feedback" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from ai_generation_requests r where r.id = ai_feedback.request_id));--> statement-breakpoint
CREATE POLICY "ai_generation_requests_org_and_client_scoped" ON "ai_generation_requests" AS PERMISSIVE FOR ALL TO public USING (
      app_is_platform_admin()
      or (
        organization_id = app_current_org_id()
        and (client_id is null or app_can_access_client(client_id))
      )
    ) WITH CHECK (
      organization_id = app_current_org_id()
      and (client_id is null or app_can_access_client(client_id))
    );--> statement-breakpoint
CREATE POLICY "ai_generation_reviews_via_parent_request" ON "ai_generation_reviews" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from ai_generation_requests r where r.id = ai_generation_reviews.request_id));--> statement-breakpoint
CREATE POLICY "custom_field_definitions_org_isolation" ON "custom_field_definitions" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "custom_field_values_via_parent_definition" ON "custom_field_values" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from custom_field_definitions d where d.id = custom_field_values.definition_id));--> statement-breakpoint
CREATE POLICY "taggings_via_parent_tag" ON "taggings" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from tags t where t.id = taggings.tag_id));--> statement-breakpoint
CREATE POLICY "tags_org_isolation" ON "tags" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "audit_log_select" ON "audit_log" AS PERMISSIVE FOR SELECT TO public USING (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "audit_log_insert" ON "audit_log" AS PERMISSIVE FOR INSERT TO public WITH CHECK (organization_id = app_current_org_id() or app_is_platform_admin());--> statement-breakpoint
CREATE POLICY "revisions_org_isolation" ON "revisions" AS PERMISSIVE FOR ALL TO public USING (organization_id = app_current_org_id() or app_is_platform_admin()) WITH CHECK (organization_id = app_current_org_id());--> statement-breakpoint
CREATE POLICY "consents_client_scoped_access" ON "consents" AS PERMISSIVE FOR ALL TO public USING (app_can_access_client(client_id) or app_is_platform_admin()) WITH CHECK (app_can_access_client(client_id));
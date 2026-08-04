import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Postgres native enums — used deliberately, only for vocabularies that
 * are small, stable, and load-bearing for application logic (a status
 * a workflow branches on, a severity a safety check keys off). Fields
 * that are likely to grow organically over time (acquisition source,
 * tag categories, specialty labels) are modeled as validated `text`
 * columns instead — see the schema files for that judgment call made
 * per field, not as a blanket rule.
 */

export const orgMemberRoleEnum = pgEnum("org_member_role", [
  "owner",
  "admin",
  "practitioner",
  "assistant",
  "student",
]);

export const unitSystemEnum = pgEnum("unit_system", ["metric", "imperial"]);

export const credentialVerificationStatusEnum = pgEnum("credential_verification_status", [
  "pending",
  "verified",
  "rejected",
  "expired",
]);

export const careTeamRoleEnum = pgEnum("care_team_role", ["primary", "secondary", "supervising"]);

export const careTeamAccessLevelEnum = pgEnum("care_team_access_level", ["full", "read_only"]);

export const clientStatusEnum = pgEnum("client_status", [
  "lead",
  "active",
  "on_hold",
  "completed",
  "churned",
  "archived",
]);

export const sexAssignedAtBirthEnum = pgEnum("sex_assigned_at_birth", [
  "female",
  "male",
  "intersex",
  "unspecified",
]);

export const dietaryRestrictionTypeEnum = pgEnum("dietary_restriction_type", [
  "medical_allergy",
  "intolerance",
  "medical_therapeutic_diet",
  "religious",
  "ethical",
  "preference",
]);

export const restrictionSeverityEnum = pgEnum("restriction_severity", [
  "mild",
  "moderate",
  "severe",
  "anaphylaxis",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "self_reported",
  "practitioner_confirmed",
  "lab_confirmed",
]);

export const medicalConditionStatusEnum = pgEnum("medical_condition_status", [
  "active",
  "managed",
  "resolved",
]);

export const metricCategoryEnum = pgEnum("metric_category", [
  "body_measurement",
  "lab_result",
  "vital_sign",
  "behavioral",
  "custom",
]);

export const metricEntrySourceEnum = pgEnum("metric_entry_source", [
  "manual_entry",
  "document_upload",
  "device_sync",
  "ai_extracted",
]);

export const goalTypeEnum = pgEnum("goal_type", [
  "target_metric",
  "behavior",
  "clinical_marker",
  "performance",
]);

export const goalStatusEnum = pgEnum("goal_status", ["active", "achieved", "abandoned", "revised"]);

export const appointmentTypeEnum = pgEnum("appointment_type", [
  "initial",
  "follow_up",
  "group_session",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentLocationTypeEnum = pgEnum("appointment_location_type", [
  "in_person",
  "remote",
]);

export const noteStatusEnum = pgEnum("note_status", ["draft", "finalized"]);

export const noteBlockTypeEnum = pgEnum("note_block_type", [
  "subjective",
  "objective",
  "assessment",
  "plan",
  "freeform",
  "addendum",
]);

export const taskStatusEnum = pgEnum("task_status", ["open", "in_progress", "done", "cancelled"]);

export const reminderChannelEnum = pgEnum("reminder_channel", ["push", "email", "sms"]);

export const automationActionTypeEnum = pgEnum("automation_action_type", [
  "create_task",
  "send_reminder",
]);

export const programStatusEnum = pgEnum("program_status", [
  "draft",
  "active",
  "completed",
  "archived",
]);

export const programDurationModelEnum = pgEnum("program_duration_model", [
  "fixed_calendar",
  "cyclical",
]);

export const foodSourceTypeEnum = pgEnum("food_source_type", [
  "usda",
  "open_food_facts",
  "ciqual",
  "org_custom",
  "practitioner_custom",
]);

export const nutrientCategoryEnum = pgEnum("nutrient_category", ["macro", "micro", "other"]);

export const templateProvenanceEnum = pgEnum("template_provenance", [
  "personal",
  "org_shared",
  "platform_curated",
  "marketplace",
]);

export const aiRequestTypeEnum = pgEnum("ai_request_type", [
  "plan_draft",
  "note_summary",
  "recipe_substitution",
  "nutrient_gap_analysis",
  "lab_document_parse",
]);

export const aiReviewStatusEnum = pgEnum("ai_review_status", [
  "pending",
  "approved",
  "edited_then_approved",
  "rejected",
]);

export const provenanceOriginEnum = pgEnum("provenance_origin", [
  "human",
  "ai_generated",
  "ai_generated_edited",
]);

export const aiFeedbackRatingEnum = pgEnum("ai_feedback_rating", ["up", "down"]);

export const attachmentVisibilityEnum = pgEnum("attachment_visibility", [
  "practitioner_only",
  "shared_with_client",
]);

export const virusScanStatusEnum = pgEnum("virus_scan_status", [
  "pending",
  "clean",
  "infected",
  "error",
]);

export const textExtractionStatusEnum = pgEnum("text_extraction_status", [
  "not_applicable",
  "pending",
  "completed",
  "failed",
]);

export const generatedDocumentTypeEnum = pgEnum("generated_document_type", [
  "meal_plan_pdf",
  "progress_report",
  "invoice",
]);

export const consentTypeEnum = pgEnum("consent_type", [
  "portal_access",
  "photo_marketing_use",
  "data_processing",
  "telehealth",
]);

export const importJobStatusEnum = pgEnum("import_job_status", [
  "pending",
  "processing",
  "completed",
  "completed_with_errors",
  "failed",
]);

export const customFieldTypeEnum = pgEnum("custom_field_type", [
  "text",
  "number",
  "date",
  "select",
  "multiselect",
  "boolean",
]);

/**
 * The set of entity kinds that can be tagged or have a file attached —
 * shared by both polymorphic systems (see Module 1's design notes on
 * using polymorphism deliberately and only for genuinely cross-cutting
 * concerns, not as a house style).
 */
export const polymorphicEntityTypeEnum = pgEnum("polymorphic_entity_type", [
  "client",
  "program",
  "recipe",
  "consultation_note",
  "metric_entry",
  "goal",
  "appointment",
  "lab_panel",
]);

-- Sprint 1.7 — Foundation for Supabase (não conectado ainda; ver DATA_MODEL.md)
-- ENUMs oficiais, integralmente de AGSOS-SPEC-003 §13. Nenhum ENUM novo foi
-- introduzido nesta auditoria/implementação.

create type actor_type as enum ('USER', 'SYSTEM', 'INTEGRATION');
create type environment_type as enum ('LOCAL', 'DEVELOPMENT', 'STAGING', 'PRODUCTION');
create type project_status as enum ('DRAFT', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED');
create type idea_status as enum ('CAPTURED', 'UNDER_REVIEW', 'PROMISING', 'APPROVED', 'CONVERTED', 'REJECTED', 'ARCHIVED');
create type task_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');
create type task_priority as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
create type game_status as enum ('DRAFT', 'IN_DEVELOPMENT', 'TESTING', 'READY_FOR_RELEASE', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED');
create type version_status as enum ('DRAFT', 'IN_DEVELOPMENT', 'TESTING', 'READY', 'RELEASED', 'DEPRECATED');
create type build_status as enum ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
create type release_status as enum ('DRAFT', 'READY_FOR_SUBMISSION', 'SUBMISSION_IN_PROGRESS', 'PARTIALLY_PUBLISHED', 'PUBLISHED', 'REJECTED', 'CANCELLED', 'ARCHIVED');
create type submission_status as enum ('DRAFT', 'WAITING', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'CANCELLED');
create type campaign_status as enum ('PLANNED', 'RUNNING', 'PAUSED', 'FINISHED', 'ARCHIVED');
create type notification_status as enum ('QUEUED', 'PROCESSING', 'DELIVERED', 'FAILED', 'CANCELLED');
create type notification_channel_type as enum ('IN_APP', 'EMAIL', 'WEBHOOK', 'PUSH');
create type notification_category as enum ('SYSTEM', 'AI', 'PROJECT', 'BUILD', 'PUBLISHING', 'MARKETING', 'FINANCE', 'SECURITY', 'INTEGRATION');
create type ledger_entry_type as enum ('REVENUE', 'EXPENSE', 'ADJUSTMENT', 'TRANSFER', 'REFUND', 'REVERSAL');
create type knowledge_document_type as enum ('SPEC', 'ADR', 'SOP', 'GUIDE', 'PLAYBOOK', 'TEMPLATE', 'POLICY', 'LESSON_LEARNED', 'TECHNICAL_DOCUMENT');
create type knowledge_document_status as enum ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'OBSOLETE', 'ARCHIVED');
create type integration_status as enum ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'DEGRADED', 'ERROR', 'DISABLED');

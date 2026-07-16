// TODO (Sprint 1.8): regenerar via `supabase gen types typescript --project-id
// REF > packages/database/src/generated/database.types.ts` assim que o
// projeto Supabase real existir. Este arquivo é hand-written por enquanto —
// existe para que packages/database compile com tipos reais (derivados das
// migrations em supabase/migrations/) enquanto não há projeto linkado.
//
// Nunca editar manualmente depois que a geração automática existir
// (ADR-003 "Nunca editar manualmente database.types.ts") — até lá, esta é a
// única fonte, mantida em sincronia manual com as migrations.

export type ActorType = "USER" | "SYSTEM" | "INTEGRATION";
export type EnvironmentType = "LOCAL" | "DEVELOPMENT" | "STAGING" | "PRODUCTION";
export type ProjectStatus = "DRAFT" | "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type IdeaStatus = "CAPTURED" | "UNDER_REVIEW" | "PROMISING" | "APPROVED" | "CONVERTED" | "REJECTED" | "ARCHIVED";
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type GameStatus = "DRAFT" | "IN_DEVELOPMENT" | "TESTING" | "READY_FOR_RELEASE" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED";
export type VersionStatus = "DRAFT" | "IN_DEVELOPMENT" | "TESTING" | "READY" | "RELEASED" | "DEPRECATED";
export type BuildStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
export type ReleaseStatus = "DRAFT" | "READY_FOR_SUBMISSION" | "SUBMISSION_IN_PROGRESS" | "PARTIALLY_PUBLISHED" | "PUBLISHED" | "REJECTED" | "CANCELLED" | "ARCHIVED";
export type SubmissionStatus = "DRAFT" | "WAITING" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED" | "CANCELLED";
export type IntegrationStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "DEGRADED" | "ERROR" | "DISABLED";
export type KnowledgeDocumentType = "SPEC" | "ADR" | "SOP" | "GUIDE" | "PLAYBOOK" | "TEMPLATE" | "POLICY" | "LESSON_LEARNED" | "TECHNICAL_DOCUMENT";
export type KnowledgeDocumentStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "OBSOLETE" | "ARCHIVED";

/** Colunas presentes em toda tabela de negócio (AGSOS-SPEC-003 §3). */
type AuditColumns = {
  created_at: string;
  created_actor_type: ActorType;
  created_actor_id: string | null;
  updated_at: string;
  updated_actor_type: ActorType;
  updated_actor_id: string | null;
  archived_at: string | null;
  archived_actor_type: ActorType | null;
  archived_actor_id: string | null;
};

type WithStudio = { id: string; studio_id: string } & AuditColumns;

export type StudiosRow = {
  id: string;
  name: string;
  logo_url: string | null;
  color_palette: Record<string, unknown> | null;
  timezone: string;
  currency: string;
  locale: string;
  active_environment_id: string | null;
  owner_user_id: string;
} & AuditColumns;

export type UsersRow = {
  id: string;
  studio_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
} & AuditColumns;

export type RolesRow = WithStudio & { name: string; description: string | null };
export type PermissionsRow = { id: string; key: string; description: string | null; created_at: string };
export type RolePermissionsRow = { id: string; studio_id: string; role_id: string; permission_id: string; created_at: string };
export type UserRolesRow = { id: string; studio_id: string; user_id: string; role_id: string; created_at: string };

export type EnvironmentsRow = WithStudio & { type: EnvironmentType; name: string };

export type IdeasRow = WithStudio & {
  title: string;
  description: string | null;
  status: IdeaStatus;
  converted_project_id: string | null;
};

export type ProjectsRow = WithStudio & {
  name: string;
  description: string | null;
  status: ProjectStatus;
  source_idea_id: string | null;
  progress: number;
};

export type EpicsRow = WithStudio & {
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
};

export type FeaturesRow = WithStudio & {
  epic_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
};

export type TasksRow = WithStudio & {
  epic_id: string;
  feature_id: string | null;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  estimate: number | null;
};

export type MilestonesRow = WithStudio & {
  project_id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
};

export type GamesRow = WithStudio & {
  project_id: string;
  name: string;
  description: string | null;
  status: GameStatus;
  bundle_identifier: string | null;
  package_name: string | null;
};

export type GameVersionsRow = WithStudio & {
  game_id: string;
  version_number: string;
  status: VersionStatus;
};

export type BuildsRow = WithStudio & {
  game_version_id: string;
  platform_id: string;
  status: BuildStatus;
  artifact_url: string | null;
  logs_url: string | null;
};

export type ReleasesRow = WithStudio & {
  game_id: string;
  game_version_id: string;
  status: ReleaseStatus;
};

export type GameLocalizationsRow = {
  id: string;
  studio_id: string;
  game_id: string;
  language_code: string;
  title: string;
  short_description: string | null;
  full_description: string | null;
  keywords: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type CertificatesRow = WithStudio & { platform_id: string; name: string; expires_at: string | null };
export type ProvisionProfilesRow = WithStudio & { platform_id: string; certificate_id: string; name: string; expires_at: string | null };
export type StoreConnectionsRow = WithStudio & { platform_id: string; status: IntegrationStatus; credentials_ref: string | null };

export type SubmissionsRow = WithStudio & {
  release_id: string;
  platform_id: string;
  build_id: string;
  status: SubmissionStatus;
};

export type StoreReviewsRow = WithStudio & {
  submission_id: string;
  reviewer_notes: string | null;
  decision: SubmissionStatus | null;
  reviewed_at: string | null;
};

export type KnowledgeDocumentsRow = WithStudio & {
  title: string;
  type: KnowledgeDocumentType;
  status: KnowledgeDocumentStatus;
};

export type KnowledgeDocumentVersionsRow = {
  id: string;
  studio_id: string;
  created_at: string;
  created_actor_type: ActorType;
  created_actor_id: string | null;
  document_id: string;
  version_number: number;
  content: string;
  summary: string | null;
};

export type KnowledgeDocumentRelationsRow = {
  id: string;
  studio_id: string;
  created_at: string;
  created_actor_type: ActorType;
  created_actor_id: string | null;
  document_id: string;
  related_type: "project" | "game" | "idea" | "task";
  related_id: string;
};

export type PlatformsRow = { id: string; name: string; kind: string; created_at: string };

export type StudioEventsRow = {
  id: string;
  event_name: string;
  event_version: number;
  aggregate_type: string;
  aggregate_id: string;
  studio_id: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  occurred_at: string;
  actor_type: ActorType;
  actor_id: string | null;
};

export type UserDashboardPreferencesRow = {
  id: string;
  user_id: string;
  studio_id: string;
  layout: Record<string, unknown> | null;
  widgets: Record<string, unknown> | null;
  collapsed_panels: Record<string, unknown> | null;
  favorite_widgets: Record<string, unknown> | null;
  updated_at: string;
};

/**
 * Formato exigido pelo `GenericSchema` do supabase-js (cada tabela precisa
 * de `Relationships`, mesmo vazio, e o schema precisa de `Views`/`Functions`/
 * `Enums`/`CompositeTypes` — sem esses campos o TS infere `never` nos
 * métodos `.insert()`/`.update()`). Real codegen (`supabase gen types`)
 * preenche `Relationships` de verdade a partir das FKs; aqui fica vazio por
 * ser hand-written.
 */
type Table<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

/** Formato mínimo compatível com o `Database` gerado pelo Supabase CLI. */
export type Database = {
  public: {
    Tables: {
      studios: Table<StudiosRow, Partial<StudiosRow>, Partial<StudiosRow>>;
      users: Table<UsersRow, Partial<UsersRow>, Partial<UsersRow>>;
      roles: Table<RolesRow, Partial<RolesRow>, Partial<RolesRow>>;
      permissions: Table<PermissionsRow, Partial<PermissionsRow>, Partial<PermissionsRow>>;
      role_permissions: Table<RolePermissionsRow, Partial<RolePermissionsRow>, Partial<RolePermissionsRow>>;
      user_roles: Table<UserRolesRow, Partial<UserRolesRow>, Partial<UserRolesRow>>;
      environments: Table<EnvironmentsRow, Partial<EnvironmentsRow>, Partial<EnvironmentsRow>>;
      ideas: Table<IdeasRow, Partial<IdeasRow>, Partial<IdeasRow>>;
      projects: Table<ProjectsRow, Partial<ProjectsRow>, Partial<ProjectsRow>>;
      epics: Table<EpicsRow, Partial<EpicsRow>, Partial<EpicsRow>>;
      features: Table<FeaturesRow, Partial<FeaturesRow>, Partial<FeaturesRow>>;
      tasks: Table<TasksRow, Partial<TasksRow>, Partial<TasksRow>>;
      milestones: Table<MilestonesRow, Partial<MilestonesRow>, Partial<MilestonesRow>>;
      games: Table<GamesRow, Partial<GamesRow>, Partial<GamesRow>>;
      game_versions: Table<GameVersionsRow, Partial<GameVersionsRow>, Partial<GameVersionsRow>>;
      builds: Table<BuildsRow, Partial<BuildsRow>, Partial<BuildsRow>>;
      releases: Table<ReleasesRow, Partial<ReleasesRow>, Partial<ReleasesRow>>;
      game_localizations: Table<GameLocalizationsRow, Partial<GameLocalizationsRow>, Partial<GameLocalizationsRow>>;
      certificates: Table<CertificatesRow, Partial<CertificatesRow>, Partial<CertificatesRow>>;
      provision_profiles: Table<ProvisionProfilesRow, Partial<ProvisionProfilesRow>, Partial<ProvisionProfilesRow>>;
      store_connections: Table<StoreConnectionsRow, Partial<StoreConnectionsRow>, Partial<StoreConnectionsRow>>;
      submissions: Table<SubmissionsRow, Partial<SubmissionsRow>, Partial<SubmissionsRow>>;
      store_reviews: Table<StoreReviewsRow, Partial<StoreReviewsRow>, Partial<StoreReviewsRow>>;
      knowledge_documents: Table<KnowledgeDocumentsRow, Partial<KnowledgeDocumentsRow>, Partial<KnowledgeDocumentsRow>>;
      knowledge_document_versions: Table<KnowledgeDocumentVersionsRow, Partial<KnowledgeDocumentVersionsRow>, Partial<KnowledgeDocumentVersionsRow>>;
      knowledge_document_relations: Table<KnowledgeDocumentRelationsRow, Partial<KnowledgeDocumentRelationsRow>, Partial<KnowledgeDocumentRelationsRow>>;
      platforms: Table<PlatformsRow, Partial<PlatformsRow>, Partial<PlatformsRow>>;
      studio_events: Table<StudioEventsRow, Partial<StudioEventsRow>, Partial<StudioEventsRow>>;
      user_dashboard_preferences: Table<UserDashboardPreferencesRow, Partial<UserDashboardPreferencesRow>, Partial<UserDashboardPreferencesRow>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

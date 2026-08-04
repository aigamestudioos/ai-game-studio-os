export { createClient as createBrowserClient } from "./browser-client";
export { createClient as createServerClient } from "./server-client";
export { createAdminClient } from "./admin-client";

// Único ponto de re-export de tipos do supabase-js — apps/web nunca deve
// importar @supabase/supabase-js diretamente (ADR-003: packages/database é a
// única camada de acesso a dados/auth).
export type { Session, User, AuthError } from "@supabase/supabase-js";

export * from "./generated/database.types";

export { createStudiosRepository } from "./repositories/studios-repository";
export { createUsersRepository } from "./repositories/users-repository";
export { createInvitesRepository } from "./repositories/invites-repository";
export { createProjectsRepository } from "./repositories/projects-repository";
export { createEpicsRepository } from "./repositories/epics-repository";
export { createGamesRepository } from "./repositories/games-repository";
export { createBuildsRepository } from "./repositories/builds-repository";
export type { BuildWithDetails } from "./repositories/builds-repository";
export { createGameVersionsRepository } from "./repositories/game-versions-repository";
export { createReleasesRepository } from "./repositories/releases-repository";
export { createPlatformsRepository } from "./repositories/platforms-repository";
export { createStudioEventsRepository } from "./repositories/studio-events-repository";
export { createKnowledgeDocumentsRepository } from "./repositories/knowledge-documents-repository";
export { createSubmissionsRepository } from "./repositories/submissions-repository";
export type { SubmissionWithDetails } from "./repositories/submissions-repository";

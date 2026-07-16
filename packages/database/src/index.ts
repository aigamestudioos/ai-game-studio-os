export { createClient as createBrowserClient } from "./browser-client";
export { createClient as createServerClient } from "./server-client";
export { createAdminClient } from "./admin-client";

// Único ponto de re-export de tipos do supabase-js — apps/web nunca deve
// importar @supabase/supabase-js diretamente (ADR-003: packages/database é a
// única camada de acesso a dados/auth).
export type { Session, User, AuthError } from "@supabase/supabase-js";

export * from "./generated/database.types";

export { createStudiosRepository } from "./repositories/studios-repository";
export { createProjectsRepository } from "./repositories/projects-repository";
export { createGamesRepository } from "./repositories/games-repository";
export { createKnowledgeDocumentsRepository } from "./repositories/knowledge-documents-repository";
export { createSubmissionsRepository } from "./repositories/submissions-repository";

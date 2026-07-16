export { createClient as createBrowserClient } from "./browser-client";
export { createClient as createServerClient } from "./server-client";
export { createAdminClient } from "./admin-client";

export * from "./generated/database.types";

export { createStudiosRepository } from "./repositories/studios-repository";
export { createProjectsRepository } from "./repositories/projects-repository";
export { createGamesRepository } from "./repositories/games-repository";
export { createKnowledgeDocumentsRepository } from "./repositories/knowledge-documents-repository";
export { createSubmissionsRepository } from "./repositories/submissions-repository";

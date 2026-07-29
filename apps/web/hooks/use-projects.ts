"use client";

import { useCallback, useEffect, useState } from "react";
import { createProjectsRepository, type ProjectsRow, type Session } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Substitui apps/web/lib/projects-store.ts (mock) — Sprint 2.0. Precisa do
// studio_id do usuário atual (via useCurrentStudio) porque `projects.studio_id`
// é obrigatório e não deve nunca ser adivinhado no client.
export function useProjects(session: Session | null | undefined, studioId: string | undefined) {
  const [projects, setProjects] = useState<ProjectsRow[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !studioId) return;
    try {
      const client = getBrowserClient();
      const repo = createProjectsRepository(client);
      const rows = await repo.list();
      setProjects(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar os projetos.");
    }
  }, [session, studioId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createProject(input: { name: string; description: string }): Promise<ProjectsRow> {
    if (!session || !studioId) throw new Error("Sessão ou Studio não carregados ainda.");
    const client = getBrowserClient();
    const repo = createProjectsRepository(client);
    const created = await repo.create({
      studio_id: studioId,
      name: input.name,
      description: input.description || null,
      created_actor_type: "USER",
      created_actor_id: session.user.id,
      updated_actor_type: "USER",
      updated_actor_id: session.user.id,
    });
    setProjects((prev) => (prev ? [created, ...prev] : [created]));
    return created;
  }

  return { projects, error, refresh: load, createProject };
}

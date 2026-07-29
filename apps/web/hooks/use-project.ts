"use client";

import { useEffect, useState } from "react";
import { createEpicsRepository, createProjectsRepository, type EpicsRow, type ProjectsRow } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Projeto + epics para a tela de detalhes (Sprint 2.0). `project === undefined`
// → carregando; `null` → carregado, não encontrado (equivalente ao antigo
// `notFound()` do mock, mas só depois de uma leitura real, não síncrona).
export function useProject(id: string) {
  const [project, setProject] = useState<ProjectsRow | null | undefined>(undefined);
  const [epics, setEpics] = useState<EpicsRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getBrowserClient();
        const projects = createProjectsRepository(client);
        const epicsRepo = createEpicsRepository(client);

        const projectRow = await projects.getById(id);
        if (cancelled) return;
        setProject(projectRow);

        if (projectRow) {
          const epicRows = await epicsRepo.listByProject(projectRow.id);
          if (!cancelled) setEpics(epicRows);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Falha ao carregar o projeto.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { project, epics, error };
}

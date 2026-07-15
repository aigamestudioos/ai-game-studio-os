"use client";

import { useEffect, useState } from "react";
import type { ProjectStatus } from "../components/dashboard/cards";

// Store mock (sem backend) — persiste em localStorage só para permitir o
// fluxo Projects → New Project → Project Details funcionar de ponta a ponta
// nesta sessão do navegador. Substituído por Supabase no Incremento 1.7.

export type ProjectEpic = {
  id: string;
  title: string;
  done: boolean;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  updatedAt: string;
  epics: ProjectEpic[];
};

const STORAGE_KEY = "agsos:projects";

const SEED_PROJECTS: Project[] = [
  {
    id: "project-alpha",
    name: "Project Alpha",
    description: "Puzzle mobile — protótipo em desenvolvimento.",
    status: "Em desenvolvimento",
    progress: 45,
    updatedAt: "há 2 horas",
    epics: [
      { id: "epic-1", title: "Definir mecânica principal", done: true },
      { id: "epic-2", title: "Protótipo jogável (greybox)", done: true },
      { id: "epic-3", title: "Onboarding do jogador", done: false },
      { id: "epic-4", title: "Sistema de níveis", done: false },
    ],
  },
  {
    id: "project-beta",
    name: "Project Beta",
    description: "Runner casual — aguardando revisão de arte.",
    status: "Em revisão",
    progress: 78,
    updatedAt: "ontem",
    epics: [
      { id: "epic-1", title: "Core loop de corrida", done: true },
      { id: "epic-2", title: "Sistema de power-ups", done: true },
      { id: "epic-3", title: "Revisão de arte final", done: false },
    ],
  },
  {
    id: "project-gamma",
    name: "Project Gamma",
    description: "Hyper-casual — publicado nas lojas.",
    status: "Publicado",
    progress: 100,
    updatedAt: "há 5 dias",
    epics: [
      { id: "epic-1", title: "MVP completo", done: true },
      { id: "epic-2", title: "Submissão às lojas", done: true },
      { id: "epic-3", title: "Lançamento", done: true },
    ],
  },
];

type Listener = () => void;

let projects: Project[] = SEED_PROJECTS;
let hydrated = false;
const listeners = new Set<Listener>();

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      projects = JSON.parse(raw) as Project[];
    } catch {
      projects = SEED_PROJECTS;
    }
  } else {
    persist();
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function addProject(input: { name: string; description: string }): Project {
  hydrate();
  const project: Project = {
    id: `${input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project"}-${Date.now().toString(36)}`,
    name: input.name,
    description: input.description,
    status: "Em desenvolvimento",
    progress: 0,
    updatedAt: "agora",
    epics: [],
  };
  projects = [project, ...projects];
  persist();
  emit();
  return project;
}

export function getProject(id: string): Project | undefined {
  hydrate();
  return projects.find((project) => project.id === id);
}

export function useProjects(): Project[] {
  const [, setTick] = useState(0);

  useEffect(() => {
    hydrate();
    setTick((tick) => tick + 1);
    const listener = () => setTick((tick) => tick + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return hydrated ? projects : SEED_PROJECTS;
}

export function useProject(id: string): Project | undefined {
  const items = useProjects();
  return items.find((project) => project.id === id);
}

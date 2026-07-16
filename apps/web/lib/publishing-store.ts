"use client";

import { useEffect, useState } from "react";

// Store mock (sem backend) — mesmo padrão de projects-store.ts/games-store.ts/
// knowledge-store.ts (ver DECISIONS.md § Sprint 1.2/1.3/1.4). Substituído por
// Supabase no Incremento 1.7.

export type SubmissionStatus = "Em análise" | "Aprovado" | "Rejeitado" | "Publicado";

export type SubmissionStore = "App Store" | "Google Play" | "Steam";

export type SubmissionEvent = {
  status: SubmissionStatus;
  date: string;
};

export type Submission = {
  id: string;
  gameName: string;
  store: SubmissionStore;
  version: string;
  status: SubmissionStatus;
  updatedAt: string;
  history: SubmissionEvent[];
};

const STORAGE_KEY = "agsos:publishing";

const SEED_SUBMISSIONS: Submission[] = [
  {
    id: "submission-nebula-drift",
    gameName: "Nebula Drift",
    store: "App Store",
    version: "0.2.0",
    status: "Em análise",
    updatedAt: "há 2 horas",
    history: [
      { status: "Em análise", date: "há 2 horas" },
    ],
  },
  {
    id: "submission-sprint-runner",
    gameName: "Sprint Runner",
    store: "Google Play",
    version: "1.0.0-rc1",
    status: "Rejeitado",
    updatedAt: "ontem",
    history: [
      { status: "Rejeitado", date: "ontem" },
      { status: "Em análise", date: "há 3 dias" },
    ],
  },
  {
    id: "submission-hyper-dash",
    gameName: "Hyper Dash",
    store: "App Store",
    version: "1.2.0",
    status: "Publicado",
    updatedAt: "há 5 dias",
    history: [
      { status: "Publicado", date: "há 5 dias" },
      { status: "Aprovado", date: "há 6 dias" },
      { status: "Em análise", date: "há 8 dias" },
    ],
  },
];

type Listener = () => void;

let submissions: Submission[] = SEED_SUBMISSIONS;
let hydrated = false;
const listeners = new Set<Listener>();

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      submissions = JSON.parse(raw) as Submission[];
    } catch {
      submissions = SEED_SUBMISSIONS;
    }
  } else {
    persist();
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function addSubmission(input: { gameName: string; store: SubmissionStore; version: string }): Submission {
  hydrate();
  const submission: Submission = {
    id: `${input.gameName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "submission"}-${Date.now().toString(36)}`,
    gameName: input.gameName,
    store: input.store,
    version: input.version,
    status: "Em análise",
    updatedAt: "agora",
    history: [{ status: "Em análise", date: "agora" }],
  };
  submissions = [submission, ...submissions];
  persist();
  emit();
  return submission;
}

export function getSubmission(id: string): Submission | undefined {
  hydrate();
  return submissions.find((submission) => submission.id === id);
}

export function useSubmissions(): Submission[] {
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

  return hydrated ? submissions : SEED_SUBMISSIONS;
}

export function useSubmission(id: string): Submission | undefined {
  const items = useSubmissions();
  return items.find((submission) => submission.id === id);
}

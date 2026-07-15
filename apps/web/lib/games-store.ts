"use client";

import { useEffect, useState } from "react";

// Store mock (sem backend) — mesmo padrão de apps/web/lib/projects-store.ts
// (ver DECISIONS.md § Sprint 1.2). Substituído por Supabase no Incremento 1.7.

export type GameStatus = "Em desenvolvimento" | "Em revisão" | "Publicado";

export type GamePlatform = "iOS" | "Android" | "Steam";

export type GameBuild = {
  id: string;
  version: string;
  status: "Em build" | "Pronta" | "Falhou";
  date: string;
};

export type Game = {
  id: string;
  name: string;
  description: string;
  status: GameStatus;
  platforms: GamePlatform[];
  updatedAt: string;
  builds: GameBuild[];
};

const STORAGE_KEY = "agsos:games";

const SEED_GAMES: Game[] = [
  {
    id: "game-nebula-drift",
    name: "Nebula Drift",
    description: "Puzzle mobile — protótipo em desenvolvimento.",
    status: "Em desenvolvimento",
    platforms: ["iOS", "Android"],
    updatedAt: "há 2 horas",
    builds: [
      { id: "build-1", version: "0.1.0", status: "Pronta", date: "há 3 dias" },
      { id: "build-2", version: "0.2.0", status: "Em build", date: "agora" },
    ],
  },
  {
    id: "game-sprint-runner",
    name: "Sprint Runner",
    description: "Runner casual — aguardando revisão de arte.",
    status: "Em revisão",
    platforms: ["iOS", "Android", "Steam"],
    updatedAt: "ontem",
    builds: [
      { id: "build-1", version: "1.0.0-rc1", status: "Pronta", date: "ontem" },
      { id: "build-2", version: "0.9.0", status: "Pronta", date: "há 4 dias" },
    ],
  },
  {
    id: "game-hyper-dash",
    name: "Hyper Dash",
    description: "Hyper-casual — publicado nas lojas.",
    status: "Publicado",
    platforms: ["iOS", "Android"],
    updatedAt: "há 5 dias",
    builds: [
      { id: "build-1", version: "1.2.0", status: "Pronta", date: "há 5 dias" },
      { id: "build-2", version: "1.1.0", status: "Pronta", date: "há 3 semanas" },
    ],
  },
];

type Listener = () => void;

let games: Game[] = SEED_GAMES;
let hydrated = false;
const listeners = new Set<Listener>();

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      games = JSON.parse(raw) as Game[];
    } catch {
      games = SEED_GAMES;
    }
  } else {
    persist();
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function addGame(input: { name: string; description: string; platforms: GamePlatform[] }): Game {
  hydrate();
  const game: Game = {
    id: `${input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "game"}-${Date.now().toString(36)}`,
    name: input.name,
    description: input.description,
    status: "Em desenvolvimento",
    platforms: input.platforms,
    updatedAt: "agora",
    builds: [],
  };
  games = [game, ...games];
  persist();
  emit();
  return game;
}

export function getGame(id: string): Game | undefined {
  hydrate();
  return games.find((game) => game.id === id);
}

export function useGames(): Game[] {
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

  return hydrated ? games : SEED_GAMES;
}

export function useGame(id: string): Game | undefined {
  const items = useGames();
  return items.find((game) => game.id === id);
}

"use client";

import { useEffect, useState } from "react";

// Store mock (sem backend) — mesmo padrão de projects-store.ts/games-store.ts
// (ver DECISIONS.md § Sprint 1.2/1.3). Substituído por Supabase no Incremento 1.7.

export type DocumentType = "Documento" | "Template" | "Playbook" | "SOP" | "ADR" | "SPEC";

export type DocumentStatus = "Rascunho" | "Publicado";

export type KnowledgeDocument = {
  id: string;
  title: string;
  summary: string;
  type: DocumentType;
  status: DocumentStatus;
  updatedAt: string;
  content: string;
};

const STORAGE_KEY = "agsos:knowledge";

const SEED_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "doc-onboarding-playbook",
    title: "Onboarding Playbook",
    summary: "Passo a passo para novos membros do estúdio.",
    type: "Playbook",
    status: "Publicado",
    updatedAt: "há 2 horas",
    content:
      "1. Acesso ao repositório e ferramentas. 2. Leitura de VISION.md e ARCHITECTURE.md. 3. Primeira tarefa guiada com um par.",
  },
  {
    id: "doc-code-review-sop",
    title: "Code Review SOP",
    summary: "Procedimento padrão para revisão de pull requests.",
    type: "SOP",
    status: "Publicado",
    updatedAt: "ontem",
    content:
      "Todo PR precisa de pelo menos uma aprovação. Rodar lint/typecheck/build localmente antes de abrir o PR. Revisar por correção, simplicidade e cobertura de testes.",
  },
  {
    id: "doc-naming-conventions",
    title: "Convenções de Nomenclatura",
    summary: "Rascunho sobre padrões de nomes de entidades e componentes.",
    type: "Documento",
    status: "Rascunho",
    updatedAt: "há 5 dias",
    content: "Em elaboração — consolidar com o UL-001 antes de publicar.",
  },
];

type Listener = () => void;

let documents: KnowledgeDocument[] = SEED_DOCUMENTS;
let hydrated = false;
const listeners = new Set<Listener>();

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      documents = JSON.parse(raw) as KnowledgeDocument[];
    } catch {
      documents = SEED_DOCUMENTS;
    }
  } else {
    persist();
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function addDocument(input: { title: string; summary: string; type: DocumentType }): KnowledgeDocument {
  hydrate();
  const document: KnowledgeDocument = {
    id: `${input.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "doc"}-${Date.now().toString(36)}`,
    title: input.title,
    summary: input.summary,
    type: input.type,
    status: "Rascunho",
    updatedAt: "agora",
    content: input.summary,
  };
  documents = [document, ...documents];
  persist();
  emit();
  return document;
}

export function getDocument(id: string): KnowledgeDocument | undefined {
  hydrate();
  return documents.find((document) => document.id === id);
}

export function useDocuments(): KnowledgeDocument[] {
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

  return hydrated ? documents : SEED_DOCUMENTS;
}

export function useDocument(id: string): KnowledgeDocument | undefined {
  const items = useDocuments();
  return items.find((document) => document.id === id);
}

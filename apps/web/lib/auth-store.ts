"use client";

// Auth mock — sem Supabase ainda (ver DECISIONS.md, Sprint 1.6). Mesmo padrão de
// seed + localStorage + pub/sub em memória usado por projects/games/knowledge/
// publishing-store.ts. Código descartável: substituído no Incremento 1.7 por
// Supabase Auth real (packages/auth, packages/database).

export type Session = {
  name: string;
  email: string;
};

const STORAGE_KEY = "agsos:session";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

// Mock: aceita qualquer email/senha não vazios — sem validação real ainda
// (a senha nem chega a ser lida). Assinatura já reflete a futura chamada real
// a `supabase.auth.signInWithPassword({ email, password })` no Incremento 1.7.
export function login(email: string, password: string): Session {
  void password;
  const name = email.split("@")[0] ?? "Fundador";
  const session: Session = { name, email };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emit();
  return session;
}

export function logout() {
  window.localStorage.removeItem(STORAGE_KEY);
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@agsos/database";
import { useAuth } from "./use-auth";

// Garante que o usuário autenticado tem um Studio (Sprint 1.8d-1): na
// primeira vez que alguém loga, não existe linha em public.users nem
// studios — ensureStudio() (useAuth) cria os três (Studio, profile, Role
// Owner) atomicamente via função SECURITY DEFINER (ver
// supabase/migrations/20260717000001_bootstrap_studio.sql). Chamado uma
// única vez por sessão a partir do AppShell.
export function useEnsureStudio(session: Session | null | undefined) {
  const { ensureStudio } = useAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (!session || attempted.current) return;
    attempted.current = true;

    const defaultName =
      (session.user.user_metadata?.full_name as string | undefined) ??
      session.user.email?.split("@")[0] ??
      "Meu";

    ensureStudio(`Estúdio de ${defaultName}`)
      .then(() => setReady(true))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Falha ao preparar seu Studio.");
      });
    // Roda uma única vez por sessão (guardado por `attempted`) — ensureStudio
    // não é memoizada, incluí-la nas deps reexecutaria a cada render.
  }, [session]);

  return { ready, error };
}

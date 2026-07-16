import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./generated/database.types";

// Operações administrativas — service role, bypassa RLS (ADR-003).
// APENAS servidor. Toda chamada que usa este cliente para ignorar RLS deve
// ter auditoria e justificativa (registrar em studio_events ou em log
// estruturado via @agsos/observability, quando esse package existir de
// verdade — Sprint 1.7 não implementa observability, só documenta o
// requisito).
//
// Nunca importar este módulo em código que roda no browser — SUPABASE_SECRET_KEY
// nunca deve chegar ao cliente (AGSOS-SPEC-004 §13: "proibido armazenar secrets no cliente").
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("admin-client não pode ser usado no browser — vazaria a secret key.");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

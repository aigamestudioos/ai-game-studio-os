// Acesso centralizado e tipado às variáveis de ambiente de apps/web.
// Nenhum outro arquivo deve ler `process.env.NEXT_PUBLIC_*`/`process.env.SUPABASE_*`
// diretamente — importar deste módulo garante erro cedo (na primeira leitura)
// em vez de `undefined` silencioso se faltar uma variável.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${name}. Ver apps/web/.env.example.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  // Secret key é server-only por natureza (nunca prefixada com NEXT_PUBLIC_) —
  // lida sob demanda em vez de eager, para não quebrar client bundles que
  // importam `env` só pelos valores públicos.
  get supabaseSecretKey(): string {
    return required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
  },
  siteUrl: required("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL),
  vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL,
  // Sprint 2.11d-2 (GATE 7) — segredo do dispatcher `/api/jobs/tick`.
  // Nunca prefixado com NEXT_PUBLIC_, nunca logado, nunca em domain event —
  // ver `apps/web/lib/jobs/dispatcher-auth.ts`.
  get jobsDispatcherSecret(): string {
    return required("JOBS_DISPATCHER_SECRET", process.env.JOBS_DISPATCHER_SECRET);
  },
  // Sprint 2.16 (GATE 25 — PRODUCTION GUARD) — nenhum processor de
  // Submission executa uma mutação real e irreversível de loja (commit de
  // Google Play Edit, criação de Apple Review Submission) a menos que esta
  // flag esteja `"true"`. Nenhum `.env`/deploy deste sprint a define — por
  // padrão é sempre `false`, mesmo em produção, até que Production
  // Validation (sprint posterior) decida ligá-la explicitamente. Ver
  // `apps/web/lib/jobs/processors/submission-google-play.ts` e
  // `submission-apple.ts`.
  get allowStoreMutation(): boolean {
    return process.env.AGSOS_ALLOW_STORE_MUTATION === "true";
  },
} as const;

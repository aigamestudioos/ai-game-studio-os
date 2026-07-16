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
} as const;

import { createServerClient } from "@supabase/ssr";
import type { Database } from "./generated/database.types";

type CookieStore = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: Record<string, unknown>): void;
};

// Server Components / Server Actions — contexto de sessão, sujeito a RLS
// (ADR-003). Recebe o cookie store como parâmetro (em vez de importar
// `next/headers` diretamente) para manter o package agnóstico de framework —
// quem chama (apps/web) passa `await cookies()` do Next.js.
export function createClient(cookieStore: CookieStore) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

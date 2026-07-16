import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./generated/database.types";

// Client Components — apenas chave publicável, sempre sujeito a RLS
// (ADR-003). Nunca usar em Server Components/Actions nem para operações
// administrativas.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

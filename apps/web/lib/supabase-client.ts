import { createBrowserClient } from "@agsos/database";

// Singleton no módulo: instanciar o client do Supabase mais de uma vez no
// browser dispara o aviso "Multiple GoTrueClient instances detected" e pode
// gerar sessões dessincronizadas entre si. Todo hook que precisa do client
// (useAuth, useCurrentStudio, etc.) importa este módulo em vez de criar o
// seu próprio, para compartilhar sempre a mesma instância.
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  browserClient ??= createBrowserClient();
  return browserClient;
}

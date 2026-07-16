"use client";

import { useEffect, useState } from "react";
import { createBrowserClient, type AuthError, type Session } from "@agsos/database";

// Singleton no módulo: instanciar o client do Supabase mais de uma vez no
// browser dispara o aviso "Multiple GoTrueClient instances detected" e pode
// gerar sessões dessincronizadas entre si. Todo hook/componente que usa
// useAuth() compartilha a mesma instância e reage ao mesmo onAuthStateChange.
let browserClient: ReturnType<typeof createBrowserClient> | null = null;
function getBrowserClient() {
  browserClient ??= createBrowserClient();
  return browserClient;
}

// Traduz os erros mais comuns do Supabase Auth para mensagens amigáveis em
// português — nunca expor `error.message` bruto da API na UI.
export function mapAuthError(error: AuthError | Error | unknown): string {
  const code = (error as AuthError)?.code;
  const message = error instanceof Error ? error.message : "";

  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return "Email ou senha incorretos.";
  }
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return "Confirme seu email antes de entrar.";
  }
  if (code === "user_already_exists" || /already registered/i.test(message)) {
    return "Já existe uma conta com este email.";
  }
  if (code === "over_request_rate_limit" || /rate limit/i.test(message)) {
    return "Muitas tentativas. Aguarde um momento e tente novamente.";
  }
  if (code === "weak_password" || /password should be/i.test(message)) {
    return "A senha não atende aos requisitos mínimos de segurança.";
  }
  if (/network|fetch failed|failed to fetch/i.test(message)) {
    return "Falha de conexão. Verifique sua internet e tente novamente.";
  }
  if (/session|jwt|token/i.test(message)) {
    return "Sua sessão expirou. Entre novamente.";
  }
  return "Algo deu errado. Tente novamente em instantes.";
}

// `session === undefined` → ainda carregando (primeira leitura em andamento).
// `session === null` → carregado, sem sessão válida.
export function useAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // onAuthStateChange cobre login, logout, refresh automático de token e
    // expiração — a aplicação nunca perde a sessão enquanto ela for válida
    // sem precisar de polling manual.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    const supabase = getBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function logout() {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
  }

  return { session, login, logout };
}

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
  if (code === "same_password") {
    return "A nova senha precisa ser diferente da atual.";
  }
  if (code === "otp_expired" || /expired|invalid.*code|code.*invalid/i.test(message)) {
    return "Este link expirou ou já foi usado. Solicite um novo.";
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

  // Sempre resolve com sucesso do ponto de vista da UI, mesmo que o email não
  // exista — evita vazar quais emails têm conta cadastrada (enumeração de
  // usuários). O Supabase já se comporta assim (não retorna erro para email
  // inexistente); mantemos a mesma postura na mensagem exibida.
  async function requestPasswordReset(email: string) {
    const supabase = getBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  // Troca o `code` do link de recuperação (PKCE) por uma sessão real —
  // necessário antes de poder chamar updatePassword(). Erros aqui (link
  // expirado/já usado/inválido) são o caso esperado, não uma falha do app.
  async function exchangeRecoveryCode(code: string) {
    const supabase = getBrowserClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }

  // Alguns links de recuperação vêm no formato antigo (implicit grant):
  // `#access_token=...&refresh_token=...&type=recovery` no fragmento da URL,
  // em vez de `?code=` (PKCE). O client de @supabase/ssr não detecta esse
  // formato sozinho (ao contrário do supabase-js "puro"), então lemos o hash
  // manualmente e estabelecemos a sessão via setSession().
  async function establishSessionFromHash(hash: string): Promise<boolean> {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) return false;

    const supabase = getBrowserClient();
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    return !error;
  }

  async function updatePassword(newPassword: string) {
    const supabase = getBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  // Perfil e preferências (nome, avatar, timezone, locale, tema) vivem em
  // auth.users.user_metadata — não em public.users, porque essa tabela
  // exige studio_id (NOT NULL) e Studios ainda não existe (Sprint 1.8d).
  // Quando Studios for implementado, migrar esses campos para public.users
  // é uma migração pequena e isolada, não um retrabalho de UI.
  async function updateProfile(fields: Record<string, unknown>) {
    const supabase = getBrowserClient();
    const { error } = await supabase.auth.updateUser({ data: fields });
    if (error) throw error;
  }

  // Encerra a sessão em todos os dispositivos/abas — o SDK do Supabase não
  // expõe uma lista real de sessões ativas (dispositivo/IP/data) para o
  // usuário final sem a Admin API (server-only), então "Sessões ativas" vira,
  // na prática, este botão único em vez de uma lista simulada com dados que
  // não existem de verdade.
  async function signOutEverywhere() {
    const supabase = getBrowserClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw error;
  }

  return {
    session,
    login,
    logout,
    requestPasswordReset,
    exchangeRecoveryCode,
    establishSessionFromHash,
    updatePassword,
    updateProfile,
    signOutEverywhere,
  };
}

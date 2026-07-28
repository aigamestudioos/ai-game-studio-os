"use server";

import { cookies } from "next/headers";
import {
  createAdminClient,
  createInvitesRepository,
  createServerClient,
} from "@agsos/database";

// Convida alguém por email para o Studio do usuário atual (Sprint 1.8d-3).
// Server Action porque `auth.admin.inviteUserByEmail` é admin-only (envia o
// email nativo do Supabase Auth com o link mágico) — não existe equivalente
// client-side. O studio_id vem da sessão real do chamador (server-client,
// sujeito a RLS), nunca de um parâmetro recebido do client, para não permitir
// convidar alguém para um Studio que não é o do chamador.
export async function inviteMember(email: string): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const supabase = createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const { data: profile } = await supabase.from("users").select("studio_id").eq("id", user.id).maybeSingle();
  if (!profile) {
    return { error: "Perfil não encontrado." };
  }

  const admin = createAdminClient();
  const invites = createInvitesRepository(supabase);
  let inviteId: string;
  try {
    const invite = await invites.create({
      studio_id: profile.studio_id,
      email,
      invited_by_user_id: user.id,
      role_name: "Member",
    });
    inviteId = invite.id;
  } catch (err) {
    // PostgrestError.code é o SQLSTATE — mais confiável que casar texto de
    // `.message`, que o PostgREST não formata de forma garantida (unique_violation
    // = 23505; ver node_modules/@supabase/postgrest-js/src/PostgrestError.ts).
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      return { error: "Já existe um convite pendente para este email." };
    }
    return { error: "Não foi possível criar o convite." };
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    // Branch por `.code` (estável), não por texto de `.message` — ver
    // node_modules/@supabase/auth-js/src/lib/error-codes.ts.
    if (error.code === "over_email_send_rate_limit") {
      // Nenhuma conta foi criada — o convite ficaria órfão para sempre.
      await invites.revoke(inviteId);
      return { error: "Muitos convites enviados recentemente. Aguarde um momento e tente novamente." };
    }

    if (error.code === "email_exists") {
      // Duas situações bem diferentes gerando o mesmo código: (a) alguém que
      // já aceitou um convite anterior e tem profile em public.users noutro
      // Studio — conflito real, o convite não faz sentido; ou (b) alguém que
      // já foi convidado antes e ainda não aceitou (auth.users existe, sem
      // profile ainda) — não é um erro, o convite atual continua válido, só
      // não conseguimos reenviar o email nativo do Supabase para uma conta
      // não confirmada duas vezes.
      const { data: existingProfile } = await admin.from("users").select("id").eq("email", email).maybeSingle();
      if (existingProfile) {
        await invites.revoke(inviteId);
        return { error: "Este email já tem uma conta em outro Studio." };
      }
      return {};
    }

    // Erro inesperado — sem conta criada, o convite não faz sentido sozinho.
    await invites.revoke(inviteId);
    return { error: "Não foi possível enviar o convite." };
  }

  return {};
}

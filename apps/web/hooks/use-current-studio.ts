"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createInvitesRepository,
  createRolesRepository,
  createStudiosRepository,
  createUsersRepository,
  type InvitesRow,
  type RolesRow,
  type Session,
  type StudiosRow,
  type UsersRow,
} from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

export type MemberWithRole = { user: UsersRow; roleName: string };

// `studio === undefined` → carregando. `studio === null` → carregado, sem
// Studio (não deveria acontecer para um usuário autenticado depois do
// Sprint 1.8d-1, mas o tipo reflete a possibilidade honestamente).
export function useCurrentStudio(session: Session | null | undefined) {
  const [studio, setStudio] = useState<StudiosRow | null | undefined>(undefined);
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [pendingInvites, setPendingInvites] = useState<InvitesRow[]>([]);
  const [roles, setRoles] = useState<RolesRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const client = getBrowserClient();
      const users = createUsersRepository(client);
      const studios = createStudiosRepository(client);
      const invites = createInvitesRepository(client);
      const rolesRepo = createRolesRepository(client);

      const profile = await users.getById(session.user.id);
      if (!profile) {
        setStudio(null);
        return;
      }

      const [studioRow, memberRows, inviteRows, roleRows] = await Promise.all([
        studios.getById(profile.studio_id),
        users.listByStudioWithRoles(profile.studio_id),
        invites.listPendingByStudio(profile.studio_id),
        rolesRepo.listByStudio(profile.studio_id),
      ]);
      setStudio(studioRow);
      setMembers(memberRows);
      setPendingInvites(inviteRows);
      setRoles(roleRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar o Studio.");
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  // A permissão de verdade é reforçada pela RLS (Sprint 1.8d-4) — erros aqui
  // (`42501`) são o caso esperado quando quem chama não tem `studio.edit`,
  // não um bug.
  async function updateStudio(fields: Partial<Pick<StudiosRow, "name" | "logo_url">>): Promise<{ error?: string }> {
    if (!studio) return {};
    try {
      const client = getBrowserClient();
      const studios = createStudiosRepository(client);
      const updated = await studios.update(studio.id, fields);
      setStudio(updated);
      return {};
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "42501") {
        return { error: "Você não tem permissão para editar este Studio." };
      }
      return { error: "Não foi possível salvar. Tente novamente." };
    }
  }

  async function revokeInvite(id: string): Promise<{ error?: string }> {
    try {
      const client = getBrowserClient();
      const invites = createInvitesRepository(client);
      await invites.revoke(id);
      setPendingInvites((prev) => prev.filter((invite) => invite.id !== id));
      return {};
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "42501") {
        return { error: "Você não tem permissão para gerenciar membros." };
      }
      return { error: "Não foi possível cancelar o convite." };
    }
  }

  // Troca o papel de um membro já existente (Sprint 2.7) — nunca oferece
  // "Owner" como opção (a UI só passa o id de um role Admin/Member); a RLS
  // (20260805000001_member_management_permissions.sql) reforça isso de
  // verdade, este guard aqui só evita a viagem ao servidor.
  async function changeMemberRole(userId: string, newRoleId: string): Promise<{ error?: string }> {
    if (!studio) return {};
    if (userId === studio.owner_user_id) {
      return { error: "Não é possível alterar o papel do Owner." };
    }
    try {
      const client = getBrowserClient();
      const rolesRepo = createRolesRepository(client);
      await rolesRepo.changeMemberRole(studio.id, userId, newRoleId);
      await load();
      return {};
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "42501") {
        return { error: "Você não tem permissão para gerenciar membros." };
      }
      return { error: "Não foi possível trocar o papel." };
    }
  }

  // Remoção de membro (Sprint 2.7) — soft-delete (`archived_at`), nunca a
  // conta de auth. Bloqueia remover o Owner ou a si mesmo (sair do Studio é
  // um fluxo diferente, fora de escopo).
  async function removeMember(userId: string): Promise<{ error?: string }> {
    if (!studio || !session) return {};
    if (userId === studio.owner_user_id) {
      return { error: "Não é possível remover o Owner do Studio." };
    }
    if (userId === session.user.id) {
      return { error: "Não é possível remover a si mesmo." };
    }
    try {
      const client = getBrowserClient();
      const users = createUsersRepository(client);
      await users.archive(userId, { actorType: "USER", actorId: session.user.id });
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
      return {};
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "42501") {
        return { error: "Você não tem permissão para gerenciar membros." };
      }
      return { error: "Não foi possível remover o membro." };
    }
  }

  return {
    studio,
    members,
    pendingInvites,
    roles,
    error,
    refresh: load,
    updateStudio,
    revokeInvite,
    changeMemberRole,
    removeMember,
  };
}

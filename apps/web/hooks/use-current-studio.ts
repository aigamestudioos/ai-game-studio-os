"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createInvitesRepository,
  createStudiosRepository,
  createUsersRepository,
  type InvitesRow,
  type Session,
  type StudiosRow,
  type UsersRow,
} from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// `studio === undefined` → carregando. `studio === null` → carregado, sem
// Studio (não deveria acontecer para um usuário autenticado depois do
// Sprint 1.8d-1, mas o tipo reflete a possibilidade honestamente).
export function useCurrentStudio(session: Session | null | undefined) {
  const [studio, setStudio] = useState<StudiosRow | null | undefined>(undefined);
  const [members, setMembers] = useState<UsersRow[]>([]);
  const [pendingInvites, setPendingInvites] = useState<InvitesRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const client = getBrowserClient();
      const users = createUsersRepository(client);
      const studios = createStudiosRepository(client);
      const invites = createInvitesRepository(client);

      const profile = await users.getById(session.user.id);
      if (!profile) {
        setStudio(null);
        return;
      }

      const [studioRow, memberRows, inviteRows] = await Promise.all([
        studios.getById(profile.studio_id),
        users.listByStudio(profile.studio_id),
        invites.listPendingByStudio(profile.studio_id),
      ]);
      setStudio(studioRow);
      setMembers(memberRows);
      setPendingInvites(inviteRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar o Studio.");
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStudio(fields: Partial<Pick<StudiosRow, "name" | "logo_url">>) {
    if (!studio) return;
    const client = getBrowserClient();
    const studios = createStudiosRepository(client);
    const updated = await studios.update(studio.id, fields);
    setStudio(updated);
  }

  async function revokeInvite(id: string) {
    const client = getBrowserClient();
    const invites = createInvitesRepository(client);
    await invites.revoke(id);
    setPendingInvites((prev) => prev.filter((invite) => invite.id !== id));
  }

  return { studio, members, pendingInvites, error, refresh: load, updateStudio, revokeInvite };
}

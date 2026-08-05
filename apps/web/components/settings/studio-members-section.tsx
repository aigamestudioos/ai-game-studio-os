"use client";

import { useState, type FormEvent } from "react";
import type { InvitesRow, RolesRow } from "@agsos/database";
import { inviteMember } from "../../app/settings/studio/actions";
import type { MemberWithRole } from "../../hooks/use-current-studio";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { toast } from "../../hooks/use-toast";

const INVITABLE_ROLES = ["Member", "Admin"] as const;

export function StudioMembersSection({
  members,
  pendingInvites,
  roles,
  currentUserId,
  studioOwnerId,
  onInvited,
  onRevoke,
  onChangeRole,
  onRemove,
}: {
  members: MemberWithRole[];
  pendingInvites: InvitesRow[];
  roles: RolesRow[];
  currentUserId: string | undefined;
  studioOwnerId: string | undefined;
  onInvited: () => void;
  onRevoke: (id: string) => Promise<{ error?: string }>;
  onChangeRole: (userId: string, newRoleId: string) => Promise<{ error?: string }>;
  onRemove: (userId: string) => Promise<{ error?: string }>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof INVITABLE_ROLES)[number]>("Member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Informe um email.");
      return;
    }

    setLoading(true);
    try {
      const result = await inviteMember(email.trim(), role);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast({ title: "Convite enviado", description: `Enviamos um email de convite para ${email}.`, variant: "success" });
      setEmail("");
      onInvited();
    } catch {
      setError("Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(id: string) {
    const result = await onRevoke(id);
    if (result.error) {
      toast({ title: "Não foi possível cancelar", description: result.error, variant: "destructive" });
    }
  }

  async function handleChangeRole(userId: string, newRoleId: string) {
    const result = await onChangeRole(userId, newRoleId);
    if (result.error) {
      toast({ title: "Não foi possível trocar o papel", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Papel atualizado", variant: "success" });
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!window.confirm(`Remover ${name} deste Studio?`)) return;
    const result = await onRemove(userId);
    if (result.error) {
      toast({ title: "Não foi possível remover", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Membro removido", variant: "success" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membros</CardTitle>
        <CardDescription>Quem tem acesso a este Studio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-lg">
        <ul className="space-y-sm">
          {members.map(({ user: member, roleName }) => {
            const initials = member.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const isOwner = member.id === studioOwnerId;
            const isSelf = member.id === currentUserId;
            const assignableRoles = roles.filter((r) => r.name === "Admin" || r.name === "Member");

            return (
              <li key={member.id} className="flex items-center gap-md">
                <Avatar className="size-9 shrink-0">
                  {member.avatar_url ? <AvatarImage src={member.avatar_url} alt={member.name} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                  <p className="truncate text-xs text-text-tertiary">{member.email}</p>
                </div>

                {isOwner ? (
                  <Badge variant="outline" className="shrink-0">
                    {roleName}
                  </Badge>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="shrink-0">
                        <Badge variant="outline" className="cursor-pointer select-none">
                          {roleName}
                        </Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {assignableRoles.map((r) => (
                        <DropdownMenuItem key={r.id} onSelect={() => handleChangeRole(member.id, r.id)} disabled={r.name === roleName}>
                          {r.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {!isOwner && !isSelf ? (
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => handleRemove(member.id, member.name)}>
                    Remover
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>

        {pendingInvites.length > 0 ? (
          <div className="space-y-sm">
            <p className="text-xs font-medium text-muted-foreground">Convites pendentes</p>
            <ul className="space-y-sm">
              {pendingInvites.map((invite) => (
                <li key={invite.id} className="flex items-center gap-md">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{invite.email}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-muted-foreground">
                    {invite.role_name}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleRevoke(invite.id)}>
                    Cancelar
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <form onSubmit={handleInvite} className="space-y-sm">
          <label htmlFor="inviteEmail" className="text-sm font-medium">
            Convidar por email
          </label>
          <div className="flex gap-sm">
            <Input
              id="inviteEmail"
              type="email"
              placeholder="pessoa@estudio.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" loading={loading} disabled={loading}>
              Convidar
            </Button>
          </div>
          <div className="flex flex-wrap gap-sm">
            {INVITABLE_ROLES.map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} aria-pressed={role === r}>
                <Badge
                  variant={role === r ? "default" : "outline"}
                  className={cn("cursor-pointer select-none", role !== r && "text-muted-foreground")}
                >
                  {r}
                </Badge>
              </button>
            ))}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

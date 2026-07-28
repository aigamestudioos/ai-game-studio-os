"use client";

import { useState, type FormEvent } from "react";
import type { InvitesRow, UsersRow } from "@agsos/database";
import { inviteMember } from "../../app/settings/studio/actions";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { toast } from "../../hooks/use-toast";

// O papel exibido compara com `ownerUserId` em vez de consultar
// roles/user_roles — é o suficiente para distinguir Owner de Member sem
// antecipar a UI de papéis granulares (Admin, etc.) do Sprint 1.8d-4, que
// ainda não tem um terceiro papel possível para justificar o join.
export function StudioMembersSection({
  members,
  pendingInvites,
  ownerUserId,
  onInvited,
  onRevoke,
}: {
  members: UsersRow[];
  pendingInvites: InvitesRow[];
  ownerUserId: string;
  onInvited: () => void;
  onRevoke: (id: string) => void;
}) {
  const [email, setEmail] = useState("");
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
      const result = await inviteMember(email.trim());
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membros</CardTitle>
        <CardDescription>Quem tem acesso a este Studio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-lg">
        <ul className="space-y-sm">
          {members.map((member) => {
            const initials = member.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
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
                <Badge variant="outline" className="shrink-0">
                  {member.id === ownerUserId ? "Owner" : "Member"}
                </Badge>
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
                  <Button variant="ghost" size="sm" onClick={() => onRevoke(invite.id)}>
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
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

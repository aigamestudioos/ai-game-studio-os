"use client";

import type { UsersRow } from "@agsos/database";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

// Sempre 1 membro por enquanto (o próprio Owner criado no bootstrap,
// Sprint 1.8d-1) — convites (1.8d-3) e papéis Admin/Member (1.8d-4) ainda
// não existem, então o badge "Owner" é fixo em vez de consultar
// roles/user_roles (seria over-engineering antes de existir um segundo papel
// possível).
export function StudioMembersSection({ members }: { members: UsersRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membros</CardTitle>
        <CardDescription>Quem tem acesso a este Studio.</CardDescription>
      </CardHeader>
      <CardContent>
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
                  Owner
                </Badge>
              </li>
            );
          })}
        </ul>
        <p className="mt-md text-xs text-muted-foreground">
          Convidar outras pessoas para o Studio ainda não está disponível.
        </p>
      </CardContent>
    </Card>
  );
}

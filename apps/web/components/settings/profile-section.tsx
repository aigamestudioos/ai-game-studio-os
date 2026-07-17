"use client";

import { useState, type FormEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { mapAuthError, useAuth } from "../../hooks/use-auth";
import { cn } from "../../lib/utils";
import { toast } from "../../hooks/use-toast";
import type { Session } from "@agsos/database";

// Curadoria curta (não a lista IANA inteira — ~400 valores não cabem bem em
// badges) cobrindo os fusos mais relevantes para estúdios de jogos mobile.
const TIMEZONES = [
  "America/Sao_Paulo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Lisbon",
  "Europe/London",
  "UTC",
  "Asia/Tokyo",
];

const LOCALES: { value: string; label: string }[] = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (US)" },
];

export function ProfileSection({ session }: { session: Session }) {
  const { updateProfile } = useAuth();
  const metadata = session.user.user_metadata ?? {};

  const [name, setName] = useState((metadata.full_name as string | undefined) ?? "");
  const [avatarUrl, setAvatarUrl] = useState((metadata.avatar_url as string | undefined) ?? "");
  const [timezone, setTimezone] = useState((metadata.timezone as string | undefined) ?? "America/Sao_Paulo");
  const [locale, setLocale] = useState((metadata.locale as string | undefined) ?? "pt-BR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = (name || session.user.email || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateProfile({ full_name: name, avatar_url: avatarUrl || null, timezone, locale });
      toast({ title: "Perfil atualizado", variant: "success" });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Como seu nome e avatar aparecem no AI Game Studio OS.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-md">
          <div className="flex items-center gap-md">
            <Avatar className="size-16">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-sm">
              <label htmlFor="avatarUrl" className="text-sm font-medium">
                URL do avatar
              </label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Upload de imagem chega quando o Supabase Storage for integrado — por ora, cole a URL de uma imagem
                já hospedada.
              </p>
            </div>
          </div>

          <div className="space-y-sm">
            <label htmlFor="name" className="text-sm font-medium">
              Nome
            </label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome"
              disabled={loading}
            />
          </div>

          <div className="space-y-sm">
            <span className="text-sm font-medium">Fuso horário</span>
            <div className="flex flex-wrap gap-sm">
              {TIMEZONES.map((tz) => (
                <button key={tz} type="button" onClick={() => setTimezone(tz)} aria-pressed={timezone === tz}>
                  <Badge
                    variant={timezone === tz ? "default" : "outline"}
                    className={cn("cursor-pointer select-none", timezone !== tz && "text-muted-foreground")}
                  >
                    {tz}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-sm">
            <span className="text-sm font-medium">Idioma</span>
            <div className="flex flex-wrap gap-sm">
              {LOCALES.map((l) => (
                <button key={l.value} type="button" onClick={() => setLocale(l.value)} aria-pressed={locale === l.value}>
                  <Badge
                    variant={locale === l.value ? "default" : "outline"}
                    className={cn("cursor-pointer select-none", locale !== l.value && "text-muted-foreground")}
                  >
                    {l.label}
                  </Badge>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Guardamos sua preferência agora; a interface passa a respeitá-la quando a tradução for implementada.
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" loading={loading} disabled={loading}>
            Salvar perfil
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

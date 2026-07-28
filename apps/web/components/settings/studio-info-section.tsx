"use client";

import { useState, type FormEvent } from "react";
import type { StudiosRow } from "@agsos/database";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { toast } from "../../hooks/use-toast";

export function StudioInfoSection({
  studio,
  onUpdate,
}: {
  studio: StudiosRow;
  onUpdate: (fields: Partial<Pick<StudiosRow, "name" | "logo_url">>) => Promise<void>;
}) {
  const [name, setName] = useState(studio.name);
  const [logoUrl, setLogoUrl] = useState(studio.logo_url ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("O nome do Studio não pode ficar vazio.");
      return;
    }

    setLoading(true);
    try {
      await onUpdate({ name: name.trim(), logo_url: logoUrl || null });
      toast({ title: "Studio atualizado", variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Studio</CardTitle>
        <CardDescription>Nome e logo do seu estúdio, visíveis em todo o AI Game Studio OS.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-md">
          <div className="flex items-center gap-md">
            <Avatar className="size-16 rounded-md">
              {logoUrl ? <AvatarImage src={logoUrl} alt={name} /> : null}
              <AvatarFallback className="rounded-md text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-sm">
              <label htmlFor="logoUrl" className="text-sm font-medium">
                URL do logo
              </label>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://..."
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-sm">
            <label htmlFor="studioName" className="text-sm font-medium">
              Nome do Studio
            </label>
            <Input
              id="studioName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" loading={loading} disabled={loading}>
            Salvar Studio
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

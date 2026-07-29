"use client";

import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Spinner } from "../../../components/ui/spinner";
import { useGame } from "../../../hooks/use-game";
import { buildStatusLabel } from "../../../lib/build-status";
import { gameStatusLabel } from "../../../lib/game-status";

const STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "outline" | "secondary" | "destructive"> = {
  Rascunho: "outline",
  "Em desenvolvimento": "default",
  "Em testes": "secondary",
  "Pronto para lançar": "warning",
  Publicado: "success",
  Suspenso: "destructive",
  Arquivado: "outline",
};

const BUILD_STATUS_ICON: Record<string, typeof CheckCircle2> = {
  Pendente: CircleDashed,
  "Em build": CircleDashed,
  Pronta: CheckCircle2,
  Falhou: XCircle,
  Cancelada: XCircle,
};

const BUILD_STATUS_COLOR: Record<string, string> = {
  Pendente: "text-text-tertiary",
  "Em build": "text-text-tertiary",
  Pronta: "text-success",
  Falhou: "text-destructive",
  Cancelada: "text-destructive",
};

export default function GameDetailsPage() {
  const params = useParams<{ id: string }>();
  const { game, builds, error } = useGame(params.id);

  if (game === null) notFound();

  if (game === undefined) {
    return (
      <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Games", href: "/games" }]}>
        <div className="flex justify-center py-2xl">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  const statusLabel = gameStatusLabel(game.status);
  const platforms = [...new Set(builds.map((build) => build.platformName))];

  return (
    <AppShell
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Games", href: "/games" }, { label: game.name }]}
    >
      <div className="space-y-lg p-lg">
        <section className="flex items-start justify-between gap-sm">
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <h1 className="text-2xl font-semibold">{game.name}</h1>
              <Badge variant={STATUS_VARIANT[statusLabel] ?? "outline"}>{statusLabel}</Badge>
            </div>
            <p className="text-muted-foreground">{game.description}</p>
          </div>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="space-y-lg lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Builds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-sm">
                {builds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma build gerada ainda.</p>
                ) : (
                  builds.map((build) => {
                    const label = buildStatusLabel(build.status);
                    const Icon = BUILD_STATUS_ICON[label] ?? CircleDashed;
                    return (
                      <div key={build.id} className="flex items-center gap-sm text-sm">
                        <Icon className={`size-4 shrink-0 ${BUILD_STATUS_COLOR[label] ?? "text-text-tertiary"}`} aria-hidden="true" />
                        <span className="font-medium">{build.versionNumber}</span>
                        <span className="text-muted-foreground">— {label}</span>
                        <span className="ml-auto shrink-0 text-xs text-text-tertiary">
                          {new Date(build.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-lg">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plataformas</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-sm">
                {platforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma plataforma ainda — aparece quando a primeira build for gerada.</p>
                ) : (
                  platforms.map((platform) => (
                    <Badge key={platform} variant="outline">
                      {platform}
                    </Badge>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

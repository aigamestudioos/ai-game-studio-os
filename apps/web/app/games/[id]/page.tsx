"use client";

import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { GameBuild, GameStatus } from "../../../lib/games-store";
import { useGame } from "../../../lib/games-store";

const STATUS_VARIANT: Record<GameStatus, "default" | "warning" | "success"> = {
  "Em desenvolvimento": "default",
  "Em revisão": "warning",
  Publicado: "success",
};

const BUILD_STATUS_ICON: Record<GameBuild["status"], typeof CheckCircle2> = {
  Pronta: CheckCircle2,
  "Em build": CircleDashed,
  Falhou: XCircle,
};

const BUILD_STATUS_COLOR: Record<GameBuild["status"], string> = {
  Pronta: "text-success",
  "Em build": "text-text-tertiary",
  Falhou: "text-destructive",
};

export default function GameDetailsPage() {
  const params = useParams<{ id: string }>();
  const game = useGame(params.id);

  if (!game) notFound();

  return (
    <AppShell
      breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Games", href: "/games" }, { label: game.name }]}
    >
      <div className="space-y-lg p-lg">
        <section className="flex items-start justify-between gap-sm">
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <h1 className="text-2xl font-semibold">{game.name}</h1>
              <Badge variant={STATUS_VARIANT[game.status]}>{game.status}</Badge>
            </div>
            <p className="text-muted-foreground">{game.description}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="space-y-lg lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Builds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-sm">
                {game.builds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma build gerada ainda.</p>
                ) : (
                  game.builds.map((build) => {
                    const Icon = BUILD_STATUS_ICON[build.status];
                    return (
                      <div key={build.id} className="flex items-center gap-sm text-sm">
                        <Icon className={`size-4 shrink-0 ${BUILD_STATUS_COLOR[build.status]}`} aria-hidden="true" />
                        <span className="font-medium">{build.version}</span>
                        <span className="text-muted-foreground">— {build.status}</span>
                        <span className="ml-auto shrink-0 text-xs text-text-tertiary">{build.date}</span>
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
                {game.platforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma plataforma selecionada.</p>
                ) : (
                  game.platforms.map((platform) => (
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

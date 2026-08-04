"use client";

import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppShell } from "../../../components/layout/app-shell";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Spinner } from "../../../components/ui/spinner";
import { Textarea } from "../../../components/ui/textarea";
import { useAuth } from "../../../hooks/use-auth";
import { useCurrentStudio } from "../../../hooks/use-current-studio";
import { useGame } from "../../../hooks/use-game";
import { useGameVersions } from "../../../hooks/use-game-versions";
import { toast } from "../../../hooks/use-toast";
import { buildStatusLabel } from "../../../lib/build-status";
import { gameStatusLabel } from "../../../lib/game-status";
import { versionStatusLabel, versionStatusVariant } from "../../../lib/version-status";

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
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { game, builds, error } = useGame(params.id);
  const { versions, error: versionsError, createVersion } = useGameVersions(session, studio?.id, params.id);

  const [open, setOpen] = useState(false);
  const [versionNumber, setVersionNumber] = useState("");
  const [changelog, setChangelog] = useState("");
  const [branch, setBranch] = useState("");
  const [commitHash, setCommitHash] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!versionNumber.trim()) return;
    setLoading(true);
    try {
      await createVersion({
        versionNumber: versionNumber.trim(),
        changelog: changelog.trim(),
        branch: branch.trim(),
        commitHash: commitHash.trim(),
      });
      toast({ title: "Versão criada", variant: "success" });
      setVersionNumber("");
      setChangelog("");
      setBranch("");
      setCommitHash("");
      setOpen(false);
    } catch {
      toast({ title: "Não foi possível criar a versão", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

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
        {versionsError ? <p className="text-sm text-destructive">{versionsError}</p> : null}

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="space-y-lg lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-sm">
                <CardTitle className="text-base">Versions</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">New Version</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateVersion}>
                      <DialogHeader>
                        <DialogTitle>Nova Versão</DialogTitle>
                        <DialogDescription>Cria uma nova versão para gerar builds e releases.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-md">
                        <div className="space-y-sm">
                          <label htmlFor="version-number" className="text-sm font-medium">
                            Versão
                          </label>
                          <Input
                            id="version-number"
                            value={versionNumber}
                            onChange={(e) => setVersionNumber(e.target.value)}
                            placeholder="Ex.: 0.3.0"
                            required
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-sm">
                          <label htmlFor="version-changelog" className="text-sm font-medium">
                            Changelog
                          </label>
                          <Textarea id="version-changelog" value={changelog} onChange={(e) => setChangelog(e.target.value)} disabled={loading} />
                        </div>
                        <div className="grid grid-cols-2 gap-sm">
                          <div className="space-y-sm">
                            <label htmlFor="version-branch" className="text-sm font-medium">
                              Branch
                            </label>
                            <Input id="version-branch" value={branch} onChange={(e) => setBranch(e.target.value)} disabled={loading} />
                          </div>
                          <div className="space-y-sm">
                            <label htmlFor="version-commit" className="text-sm font-medium">
                              Commit
                            </label>
                            <Input id="version-commit" value={commitHash} onChange={(e) => setCommitHash(e.target.value)} disabled={loading} />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" loading={loading} disabled={loading || !versionNumber.trim()}>
                          Criar Versão
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-sm">
                {!versions ? (
                  <div className="flex justify-center py-lg">
                    <Spinner />
                  </div>
                ) : versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma versão ainda — crie a primeira acima.</p>
                ) : (
                  versions.map((version) => (
                    <Link
                      key={version.id}
                      href={`/games/${params.id}/versions/${version.id}`}
                      className="flex items-center gap-sm rounded-sm p-sm text-sm hover:bg-muted"
                    >
                      <span className="font-medium">{version.version_number}</span>
                      <Badge variant={versionStatusVariant(version.status)}>{versionStatusLabel(version.status)}</Badge>
                      <span className="ml-auto shrink-0 text-xs text-text-tertiary">
                        {new Date(version.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

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

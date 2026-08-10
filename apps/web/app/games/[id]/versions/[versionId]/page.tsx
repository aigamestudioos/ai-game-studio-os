"use client";

import { createPlatformsRepository, type PlatformsRow } from "@agsos/database";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../../../../../components/layout/app-shell";
import { BuildArtifactPanel } from "../../../../../components/builds/build-artifact-panel";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../../components/ui/dialog";
import { Input } from "../../../../../components/ui/input";
import { Spinner } from "../../../../../components/ui/spinner";
import { Textarea } from "../../../../../components/ui/textarea";
import { useAuth } from "../../../../../hooks/use-auth";
import { useCurrentStudio } from "../../../../../hooks/use-current-studio";
import { useGameVersion } from "../../../../../hooks/use-game-version";
import { toast } from "../../../../../hooks/use-toast";
import { buildStatusLabel, buildTypeLabel } from "../../../../../lib/build-status";
import { isBuildStuck } from "../../../../../lib/build-simulation";
import { getBrowserClient } from "../../../../../lib/supabase-client";
import { releaseChannelLabel, releaseStatusLabel, releaseStatusVariant } from "../../../../../lib/release-status";
import { versionStatusLabel, versionStatusVariant } from "../../../../../lib/version-status";

const BUILD_TYPES = ["DEBUG", "RELEASE", "INTERNAL", "PRODUCTION"] as const;
const RELEASE_CHANNELS = ["INTERNAL", "ALPHA", "BETA", "PRODUCTION"] as const;

const BUILD_STATUS_VARIANT: Record<string, "default" | "warning" | "success" | "destructive" | "outline"> = {
  Pendente: "outline",
  "Em build": "warning",
  Pronta: "success",
  Falhou: "destructive",
  Cancelada: "outline",
};

export default function GameVersionDetailsPage() {
  const params = useParams<{ id: string; versionId: string }>();
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { version, builds, releases, events, error, createBuild, createRelease, retryBuild } = useGameVersion(
    session,
    studio?.id,
    params.versionId,
  );

  const [platforms, setPlatforms] = useState<PlatformsRow[] | undefined>(undefined);
  const [buildOpen, setBuildOpen] = useState(false);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [buildType, setBuildType] = useState<(typeof BUILD_TYPES)[number]>("INTERNAL");
  const [buildLoading, setBuildLoading] = useState(false);
  const [retryingBuildId, setRetryingBuildId] = useState<string | null>(null);

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releaseChannel, setReleaseChannel] = useState<(typeof RELEASE_CHANNELS)[number]>("INTERNAL");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [rollout, setRollout] = useState("100");
  const [releaseLoading, setReleaseLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    createPlatformsRepository(getBrowserClient())
      .list()
      .then(setPlatforms)
      .catch(() => setPlatforms([]));
  }, [session]);

  if (version === null) notFound();

  if (version === undefined) {
    return (
      <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Games", href: "/games" }]}>
        <div className="flex justify-center py-2xl">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  async function handleCreateBuild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!platformId) return;
    setBuildLoading(true);
    try {
      await createBuild({ platformId, buildType });
      toast({ title: "Build iniciada", description: "Acompanhe o progresso na lista de builds.", variant: "success" });
      setBuildOpen(false);
      setPlatformId(null);
      setBuildType("INTERNAL");
    } catch {
      toast({ title: "Não foi possível criar a build", variant: "destructive" });
    } finally {
      setBuildLoading(false);
    }
  }

  async function handleRetryBuild(buildId: string) {
    setRetryingBuildId(buildId);
    try {
      await retryBuild(buildId);
      toast({ title: "Build reiniciada", variant: "success" });
    } catch {
      toast({ title: "Não foi possível reiniciar a build", variant: "destructive" });
    } finally {
      setRetryingBuildId(null);
    }
  }

  async function handleCreateRelease(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rolloutValue = Number(rollout);
    if (!Number.isFinite(rolloutValue) || rolloutValue < 0 || rolloutValue > 100) return;
    setReleaseLoading(true);
    try {
      await createRelease({ releaseChannel, releaseNotes: releaseNotes.trim(), rolloutPercentage: rolloutValue });
      toast({ title: "Release criado", variant: "success" });
      setReleaseOpen(false);
      setReleaseNotes("");
      setRollout("100");
      setReleaseChannel("INTERNAL");
    } catch {
      toast({ title: "Não foi possível criar o release", variant: "destructive" });
    } finally {
      setReleaseLoading(false);
    }
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Games", href: "/games" },
        { label: "Game", href: `/games/${params.id}` },
        { label: version.version_number },
      ]}
    >
      <div className="space-y-lg p-lg">
        <section className="flex items-start justify-between gap-sm">
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <h1 className="text-2xl font-semibold">Versão {version.version_number}</h1>
              <Badge variant={versionStatusVariant(version.status)}>{versionStatusLabel(version.status)}</Badge>
            </div>
            {version.branch || version.commit_hash ? (
              <p className="text-sm text-muted-foreground">
                {version.branch ? `${version.branch}` : null}
                {version.branch && version.commit_hash ? " — " : null}
                {version.commit_hash ? version.commit_hash.slice(0, 12) : null}
              </p>
            ) : null}
            {version.changelog ? <p className="max-w-2xl text-muted-foreground">{version.changelog}</p> : null}
          </div>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <p className="rounded-sm border border-border bg-muted/50 p-sm text-xs text-muted-foreground">
          As builds desta versão são simuladas no navegador — não há CI/CD real ainda. Fechar ou atualizar a página
          durante uma build pode interromper o progresso; pipelines reais serão adicionados futuramente.
        </p>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-sm">
              <CardTitle className="text-base">Builds</CardTitle>
              <Dialog open={buildOpen} onOpenChange={setBuildOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!platforms || platforms.length === 0}>
                    New Build
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateBuild}>
                    <DialogHeader>
                      <DialogTitle>Nova Build</DialogTitle>
                      <DialogDescription>
                        Sem CI/CD real ainda — o progresso (fila/build/pronta) é simulado.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-md">
                      <div className="space-y-sm">
                        <span className="text-sm font-medium">Plataforma</span>
                        <div className="flex flex-wrap gap-sm">
                          {(platforms ?? []).map((platform) => {
                            const selected = platformId === platform.id;
                            return (
                              <button key={platform.id} type="button" onClick={() => setPlatformId(platform.id)} aria-pressed={selected}>
                                <Badge variant={selected ? "default" : "outline"}>{platform.name}</Badge>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-sm">
                        <span className="text-sm font-medium">Tipo</span>
                        <div className="flex flex-wrap gap-sm">
                          {BUILD_TYPES.map((type) => {
                            const selected = buildType === type;
                            return (
                              <button key={type} type="button" onClick={() => setBuildType(type)} aria-pressed={selected}>
                                <Badge variant={selected ? "default" : "outline"}>{buildTypeLabel(type)}</Badge>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" loading={buildLoading} disabled={buildLoading || !platformId}>
                        Criar Build
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-sm">
              {builds.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma build ainda.</p>
              ) : (
                builds.map((build) => {
                  const label = buildStatusLabel(build.status);
                  const stuck = isBuildStuck(build);
                  return (
                    <div key={build.id} className="space-y-1">
                      <div className="flex items-center gap-sm text-sm">
                        <Badge variant={stuck ? "destructive" : (BUILD_STATUS_VARIANT[label] ?? "outline")}>
                          {stuck ? "Build travada" : label}
                        </Badge>
                        <span className="font-medium">#{build.build_number ?? "—"}</span>
                        <span className="text-muted-foreground">{buildTypeLabel(build.build_type)}</span>
                        {build.checksum ? (
                          <span className="ml-auto shrink-0 text-xs text-text-tertiary">{build.checksum} (simulado)</span>
                        ) : null}
                      </div>
                      {stuck ? (
                        <div className="flex items-center gap-sm rounded-sm bg-destructive/10 p-sm text-xs text-destructive">
                          <span>
                            A execução simulada desta build foi interrompida (a aba provavelmente foi recarregada ou
                            fechada). Isso não é uma falha real de build — é uma limitação da simulação client-side.
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-auto shrink-0"
                            loading={retryingBuildId === build.id}
                            onClick={() => handleRetryBuild(build.id)}
                          >
                            Retry Build
                          </Button>
                        </div>
                      ) : null}
                      <BuildArtifactPanel session={session} buildId={build.id} gameId={params.id} />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-sm">
              <CardTitle className="text-base">Releases</CardTitle>
              <Dialog open={releaseOpen} onOpenChange={setReleaseOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Create Release</Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateRelease}>
                    <DialogHeader>
                      <DialogTitle>Novo Release</DialogTitle>
                      <DialogDescription>
                        Um Release pronto habilita a criação de Submissions em Publishing.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-md">
                      <div className="space-y-sm">
                        <span className="text-sm font-medium">Canal</span>
                        <div className="flex flex-wrap gap-sm">
                          {RELEASE_CHANNELS.map((channel) => {
                            const selected = releaseChannel === channel;
                            return (
                              <button key={channel} type="button" onClick={() => setReleaseChannel(channel)} aria-pressed={selected}>
                                <Badge variant={selected ? "default" : "outline"}>{releaseChannelLabel(channel)}</Badge>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-sm">
                        <label htmlFor="release-notes" className="text-sm font-medium">
                          Release notes
                        </label>
                        <Textarea id="release-notes" value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} />
                      </div>
                      <div className="space-y-sm">
                        <label htmlFor="rollout" className="text-sm font-medium">
                          Rollout (%)
                        </label>
                        <Input id="rollout" type="number" min={0} max={100} value={rollout} onChange={(e) => setRollout(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" loading={releaseLoading} disabled={releaseLoading}>
                        Criar Release
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-sm">
              {releases.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum release ainda.</p>
              ) : (
                releases.map((release) => (
                  <div key={release.id} className="flex items-center gap-sm text-sm">
                    <Badge variant={releaseStatusVariant(release.status)}>{releaseStatusLabel(release.status)}</Badge>
                    <span className="font-medium">{releaseChannelLabel(release.release_channel)}</span>
                    {release.rollout_percentage !== null ? (
                      <span className="text-muted-foreground">{release.rollout_percentage}% rollout</span>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-sm">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento ainda.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex items-center gap-sm text-sm">
                  <span className="font-medium">{event.event_name}</span>
                  <span className="ml-auto shrink-0 text-xs text-text-tertiary">
                    {new Date(event.occurred_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

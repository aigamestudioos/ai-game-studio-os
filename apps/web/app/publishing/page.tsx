"use client";

import { Rocket } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AppShell } from "../../components/layout/app-shell";
import { SubmissionCard } from "../../components/publishing/cards";
import { ReadinessPanel } from "../../components/publishing/readiness-panel";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Spinner } from "../../components/ui/spinner";
import { useAuth } from "../../hooks/use-auth";
import { useCurrentStudio } from "../../hooks/use-current-studio";
import { usePublishableReleases } from "../../hooks/use-publishable-releases";
import { useReleaseReadiness } from "../../hooks/use-release-readiness";
import { useSubmissions } from "../../hooks/use-submissions";
import { toast } from "../../hooks/use-toast";
import { isReadyForSubmissionGate } from "../../lib/readiness-status";
import { releaseChannelLabel } from "../../lib/release-status";

export default function PublishingPage() {
  const { session } = useAuth();
  const { studio } = useCurrentStudio(session);
  const { submissions, error, refresh: refreshSubmissions } = useSubmissions(session, studio?.id);
  const { releases, createSubmission } = usePublishableReleases(session, studio?.id);

  const [open, setOpen] = useState(false);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedRelease = releases?.find((r) => r.releaseId === releaseId);
  const hasReleases = !!releases && releases.length > 0;

  // GATE 9 — Submission Gate: readiness do Release selecionado no diálogo
  // decide se "Criar Submissão" fica habilitado. Criar Submissão continua
  // um passo distinto e explícito (nunca automático s treinamento por
  // ficar READY) — este hook só LÊ o veredito, a ação de criar continua a
  // mesma de sempre (handleSubmit abaixo), sem nenhum envio a review/loja.
  const {
    readiness,
    loading: readinessLoading,
    error: readinessError,
    reload: reloadReadiness,
  } = useReleaseReadiness(session, releaseId ?? undefined);
  // Sprint 2.14 — GATE resolvido (ver lib/readiness-status.ts): o Submission
  // Gate não trata `SUBMISSION_TARGETS_MISSING` como blocker de criação —
  // ele descreve exatamente a ausência que este diálogo serve para
  // resolver, não uma inconsistência prévia. A lógica do RPC 2.12a/2.12c
  // permanece intocada; só a interpretação do Gate mudou. Investigação e
  // decisão completas em DECISIONS.md/IMPLEMENTATION_LOG.md (Sprint 2.14).
  const isReady = isReadyForSubmissionGate(readiness);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!releaseId || !platformId || !selectedRelease) return;
    const build = selectedRelease.builds.find((b) => b.platformId === platformId);
    if (!build) return;

    setLoading(true);
    try {
      await createSubmission({ releaseId, buildId: build.buildId, platformId });
      toast({ title: "Submissão criada", variant: "success" });
      setOpen(false);
      setReleaseId(null);
      setPlatformId(null);
      refreshSubmissions();
    } catch {
      toast({ title: "Não foi possível criar a submissão", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Publishing" }]}>
      <div className="space-y-lg p-lg">
        <section className="flex items-center justify-between gap-sm">
          <div>
            <h1 className="text-2xl font-semibold">Publishing</h1>
            <p className="text-muted-foreground">Acompanhe as submissões dos seus jogos nas lojas.</p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!hasReleases} title={hasReleases ? undefined : "Nenhum Release com build disponível ainda"}>
                <Rocket className="mr-sm size-4" aria-hidden="true" />
                New Submission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Nova Submissão</DialogTitle>
                  <DialogDescription>Envie uma build para revisão em uma das lojas.</DialogDescription>
                </DialogHeader>
                <div className="space-y-md">
                  <div className="space-y-sm">
                    <span className="text-sm font-medium">Release</span>
                    <div className="flex flex-wrap gap-sm">
                      {(releases ?? []).map((release) => {
                        const selected = releaseId === release.releaseId;
                        return (
                          <button
                            key={release.releaseId}
                            type="button"
                            onClick={() => {
                              setReleaseId(release.releaseId);
                              setPlatformId(null);
                            }}
                            aria-pressed={selected}
                          >
                            <Badge variant={selected ? "default" : "outline"}>
                              {release.gameName} v{release.versionNumber} — {releaseChannelLabel(release.releaseChannel)}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {selectedRelease ? (
                    <div className="space-y-sm">
                      <span className="text-sm font-medium">Plataforma</span>
                      <div className="flex flex-wrap gap-sm">
                        {selectedRelease.builds.map((build) => {
                          const selected = platformId === build.platformId;
                          return (
                            <button key={build.buildId} type="button" onClick={() => setPlatformId(build.platformId)} aria-pressed={selected}>
                              <Badge variant={selected ? "default" : "outline"}>{build.platformName}</Badge>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  {releaseId ? (
                    <ReadinessPanel readiness={readiness} loading={readinessLoading} error={readinessError} onReload={reloadReadiness} />
                  ) : null}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading || !releaseId || !platformId || !isReady}
                    title={releaseId && !isReady ? "Este Release ainda não está pronto (ver Release Readiness acima)" : undefined}
                  >
                    Criar Submissão
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!hasReleases ? (
          <p className="text-sm text-muted-foreground">
            Uma Submissão exige um Release com pelo menos uma Build. Crie uma Version, uma Build e um Release em um
            Game para habilitar "New Submission" aqui.
          </p>
        ) : null}

        {!submissions ? (
          <div className="flex justify-center py-2xl">
            <Spinner size="lg" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma submissão ainda.</p>
        ) : (
          <section className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {submissions.map((submission) => (
              <Link key={submission.id} href={`/publishing/${submission.id}`} className="block">
                <SubmissionCard
                  gameName={submission.gameName}
                  platformName={submission.platformName}
                  versionNumber={submission.versionNumber}
                  status={submission.status}
                  updatedAt={new Date(submission.updatedAt).toLocaleDateString("pt-BR")}
                />
              </Link>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}

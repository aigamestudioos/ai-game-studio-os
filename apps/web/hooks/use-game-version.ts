"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createBuildsRepository,
  createGameVersionsRepository,
  createReleasesRepository,
  createStudioEventsRepository,
  type BuildsRow,
  type GameVersionsRow,
  type ReleasesRow,
  type Session,
  type StudioEventsRow,
} from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";
import { BUILD_SIMULATION_RUNNING_DELAY_MS, BUILD_SIMULATION_SUCCEEDED_DELAY_MS } from "../lib/build-simulation";
import { releasePipelineEvent } from "../lib/domain-events";

// Version + Builds + Releases + Timeline (Sprint 2.5). Não há CI/CD real
// ainda (AGSOS-SPEC-003 não define esse domínio) — a progressão de status de
// Build é simulada no client (PENDING → RUNNING → SUCCEEDED), persistida a
// cada transição via `BuildsRepository.update()`, com eventos emitidos em
// `studio_events` a cada passo. A arquitetura (repository + evento por
// transição) é a mesma que uma integração real de CI/CD usaria — só o
// disparo (setTimeout em vez de webhook) é mock. Os atrasos ficam
// centralizados em `lib/build-simulation.ts`, junto com o limite usado para
// detectar uma Build travada (aba fechada/recarregada no meio da
// simulação) — ver `isBuildStuck()` e o botão "Retry Build" na UI.
export function useGameVersion(session: Session | null | undefined, studioId: string | undefined, versionId: string) {
  const [version, setVersion] = useState<GameVersionsRow | null | undefined>(undefined);
  const [builds, setBuilds] = useState<BuildsRow[]>([]);
  const [releases, setReleases] = useState<ReleasesRow[]>([]);
  const [events, setEvents] = useState<StudioEventsRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !studioId) return;
    try {
      const client = getBrowserClient();
      const versions = createGameVersionsRepository(client);
      const buildsRepo = createBuildsRepository(client);
      const releasesRepo = createReleasesRepository(client);
      const eventsRepo = createStudioEventsRepository(client);

      const row = await versions.getById(versionId);
      setVersion(row);
      if (!row) return;

      const [buildRows, releaseRows, eventRows] = await Promise.all([
        buildsRepo.listByVersion(row.id),
        releasesRepo.listByVersion(row.id),
        eventsRepo.listByGameVersion(row.id),
      ]);
      setBuilds(buildRows);
      setReleases(releaseRows);
      setEvents(eventRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar a versão.");
    }
  }, [session, studioId, versionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Agenda a simulação PENDING→RUNNING→SUCCEEDED de uma Build já existente
  // (usado tanto por createBuild() quanto por retryBuild() — mesmo timer,
  // reaproveitado em vez de duplicado). Best-effort: se a aba for fechada ou
  // recarregada antes de um passo disparar, esse `setTimeout` simplesmente
  // desaparece — é a limitação documentada em `lib/build-simulation.ts`.
  function scheduleBuildSimulation(buildId: string, gameVersionId: string, userId: string, buildStudioId: string) {
    const client = getBrowserClient();
    const buildsRepo = createBuildsRepository(client);
    const eventsRepo = createStudioEventsRepository(client);

    setTimeout(async () => {
      try {
        const running = await buildsRepo.update(buildId, { status: "RUNNING", updated_actor_type: "USER", updated_actor_id: userId });
        setBuilds((prev) => prev.map((b) => (b.id === running.id ? running : b)));
      } catch {
        // Simulação best-effort — falha aqui não deve travar a UI.
      }
    }, BUILD_SIMULATION_RUNNING_DELAY_MS);

    setTimeout(async () => {
      try {
        const succeeded = await buildsRepo.update(buildId, {
          status: "SUCCEEDED",
          artifact_url: `https://builds.aigamestudioos.local/mock/${buildId}.zip`,
          artifact_size: 42_000_000,
          checksum: buildId.replace(/-/g, "").slice(0, 40),
          generated_at: new Date().toISOString(),
          updated_actor_type: "USER",
          updated_actor_id: userId,
        });
        setBuilds((prev) => prev.map((b) => (b.id === succeeded.id ? succeeded : b)));
        await eventsRepo.create({
          studio_id: buildStudioId,
          ...releasePipelineEvent("BuildFinished", { status: "SUCCEEDED" }),
          event_version: 1,
          aggregate_type: "build",
          aggregate_id: succeeded.id,
          metadata: { game_version_id: gameVersionId },
          actor_type: "USER",
          actor_id: userId,
        });
        load();
      } catch {
        // Simulação best-effort.
      }
    }, BUILD_SIMULATION_RUNNING_DELAY_MS + BUILD_SIMULATION_SUCCEEDED_DELAY_MS);
  }

  async function createBuild(input: { platformId: string; buildType: "DEBUG" | "RELEASE" | "INTERNAL" | "PRODUCTION" }) {
    if (!session || !studioId || !version) throw new Error("Sessão, Studio ou Version não carregados ainda.");
    const client = getBrowserClient();
    const buildsRepo = createBuildsRepository(client);
    const eventsRepo = createStudioEventsRepository(client);

    const nextBuildNumber = builds.filter((b) => b.platform_id === input.platformId).length + 1;

    const created = await buildsRepo.create({
      studio_id: studioId,
      game_version_id: version.id,
      platform_id: input.platformId,
      build_type: input.buildType,
      build_number: nextBuildNumber,
      created_actor_type: "USER",
      created_actor_id: session.user.id,
      updated_actor_type: "USER",
      updated_actor_id: session.user.id,
    });
    setBuilds((prev) => [created, ...prev]);

    await eventsRepo.create({
      studio_id: studioId,
      ...releasePipelineEvent("BuildCreated", { platform_id: input.platformId, build_type: input.buildType, game_version_id: version.id }),
      event_version: 1,
      aggregate_type: "build",
      aggregate_id: created.id,
      metadata: { game_version_id: version.id },
      actor_type: "USER",
      actor_id: session.user.id,
    });

    scheduleBuildSimulation(created.id, version.id, session.user.id, studioId);

    return created;
  }

  // Recuperação de Build travada (Sprint 2.5 — hardening). Reaproveita a
  // mesma linha (o schema não tem um conceito de "tentativa" separado — ver
  // débito registrado em IMPLEMENTATION_LOG.md): registra BuildFailed para
  // não apagar o histórico de que a tentativa anterior travou, volta o
  // status para PENDING e reinicia a simulação do zero.
  async function retryBuild(buildId: string) {
    if (!session || !studioId || !version) throw new Error("Sessão, Studio ou Version não carregados ainda.");
    const client = getBrowserClient();
    const buildsRepo = createBuildsRepository(client);
    const eventsRepo = createStudioEventsRepository(client);
    const actor = { actor_type: "USER" as const, actor_id: session.user.id };

    await eventsRepo.create({
      studio_id: studioId,
      ...releasePipelineEvent("BuildFailed", { reason: "stuck_simulation_timeout" }),
      event_version: 1,
      aggregate_type: "build",
      aggregate_id: buildId,
      metadata: { game_version_id: version.id },
      ...actor,
    });

    const reset = await buildsRepo.update(buildId, {
      status: "PENDING",
      updated_actor_type: "USER",
      updated_actor_id: session.user.id,
    });
    setBuilds((prev) => prev.map((b) => (b.id === reset.id ? reset : b)));

    await eventsRepo.create({
      studio_id: studioId,
      ...releasePipelineEvent("BuildRetried", {}),
      event_version: 1,
      aggregate_type: "build",
      aggregate_id: buildId,
      metadata: { game_version_id: version.id },
      ...actor,
    });
    load();

    scheduleBuildSimulation(buildId, version.id, session.user.id, studioId);
  }

  async function createRelease(input: { releaseChannel: "INTERNAL" | "ALPHA" | "BETA" | "PRODUCTION"; releaseNotes: string; rolloutPercentage: number }) {
    if (!session || !studioId || !version) throw new Error("Sessão, Studio ou Version não carregados ainda.");
    const client = getBrowserClient();
    const releasesRepo = createReleasesRepository(client);
    const eventsRepo = createStudioEventsRepository(client);

    const created = await releasesRepo.create({
      studio_id: studioId,
      game_id: version.game_id,
      game_version_id: version.id,
      release_channel: input.releaseChannel,
      release_notes: input.releaseNotes || null,
      rollout_percentage: input.rolloutPercentage,
      created_actor_type: "USER",
      created_actor_id: session.user.id,
      updated_actor_type: "USER",
      updated_actor_id: session.user.id,
    });
    setReleases((prev) => [created, ...prev]);

    await eventsRepo.create({
      studio_id: studioId,
      ...releasePipelineEvent("ReleaseCreated", { release_channel: input.releaseChannel, game_version_id: version.id }),
      event_version: 1,
      aggregate_type: "release",
      aggregate_id: created.id,
      metadata: { game_version_id: version.id },
      actor_type: "USER",
      actor_id: session.user.id,
    });
    load();

    return created;
  }

  return { version, builds, releases, events, error, refresh: load, createBuild, createRelease, retryBuild };
}

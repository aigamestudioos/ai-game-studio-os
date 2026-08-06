// Sprint 2.6 — eventos tipados do Release Pipeline. Antes disso, cada
// call site de `studioEventsRepository.create()` montava `payload` como
// `Record<string, unknown>` solto, sem nenhuma garantia de que o nome do
// evento e o formato do payload combinavam. Isso só formaliza os tipos —
// não é uma camada nova de arquitetura (Service/UseCase), continua sendo
// os hooks (`use-game-version.ts`, `use-publishable-releases.ts`) que
// chamam `studioEventsRepository.create()` diretamente; decisão registrada
// em DECISIONS.md.

export type VersionCreatedPayload = { version_number: string; game_id: string };
export type BuildCreatedPayload = { platform_id: string; build_type: string; game_version_id: string };
export type BuildFinishedPayload = { status: "SUCCEEDED" };
export type BuildFailedPayload = { reason: string };
export type BuildRetriedPayload = Record<string, never>;
export type ReleaseCreatedPayload = { release_channel: string; game_version_id: string };
export type SubmissionCreatedPayload = { release_id: string; platform_id: string };

export type ReleasePipelineEvent =
  | { name: "VersionCreated"; payload: VersionCreatedPayload }
  | { name: "BuildCreated"; payload: BuildCreatedPayload }
  | { name: "BuildFinished"; payload: BuildFinishedPayload }
  | { name: "BuildFailed"; payload: BuildFailedPayload }
  | { name: "BuildRetried"; payload: BuildRetriedPayload }
  | { name: "ReleaseCreated"; payload: ReleaseCreatedPayload }
  | { name: "SubmissionCreated"; payload: SubmissionCreatedPayload };

export type ReleasePipelineEventName = ReleasePipelineEvent["name"];

// Helper para não deixar `event_name`/`payload` divergirem por engano —
// chamado como `releasePipelineEvent("BuildCreated", { platform_id, ... })`;
// o segundo argumento só tipa se corresponder ao evento do primeiro.
type PayloadFor<Name extends ReleasePipelineEventName> = Extract<ReleasePipelineEvent, { name: Name }>["payload"];

export function releasePipelineEvent<Name extends ReleasePipelineEventName>(
  name: Name,
  payload: PayloadFor<Name>,
): { event_name: Name; payload: PayloadFor<Name> } {
  // O compilador não consegue provar a distribuição do tipo condicional
  // dentro do corpo da função (limitação conhecida do TS com tipos
  // condicionais genéricos) — a segurança de tipo real está na assinatura
  // acima, que já força `payload` a combinar com `name` em todo call site.
  return { event_name: name, payload } as never;
}

// Sprint 2.8 — mesmos tipos/helper, domínio diferente (Store Connections,
// não Release Pipeline — união separada por bounded context, AGSOS-SPEC-002
// §8). Definidos no Sprint 2.8 sem nenhum call site ainda (só schema/RLS/
// Vault); o Sprint 2.9 (adapter Apple + UI) é quem finalmente emite todos
// eles — `payload` nunca inclui nada sensível (sem JWT/private
// key/credentials_ref/payload do Vault, "nunca registrar secrets em
// eventos").
export type StoreConnectionCreatedPayload = { platform_id: string; display_name: string | null };
export type StoreConnectionUpdatedPayload = { fields: string[] };
export type StoreConnectionValidatedPayload = { status: "CONNECTED" | "ERROR"; error: string | null };
export type StoreConnectionDeletedPayload = Record<string, never>;
export type StoreConnectionHealthCheckedPayload = { ok: boolean };
export type StoreAppsDiscoveredPayload = { count: number };

export type StoreConnectionEvent =
  | { name: "StoreConnectionCreated"; payload: StoreConnectionCreatedPayload }
  | { name: "StoreConnectionUpdated"; payload: StoreConnectionUpdatedPayload }
  | { name: "StoreConnectionValidated"; payload: StoreConnectionValidatedPayload }
  | { name: "StoreConnectionDeleted"; payload: StoreConnectionDeletedPayload }
  | { name: "StoreConnectionHealthChecked"; payload: StoreConnectionHealthCheckedPayload }
  | { name: "StoreAppsDiscovered"; payload: StoreAppsDiscoveredPayload };

export type StoreConnectionEventName = StoreConnectionEvent["name"];

type StoreConnectionPayloadFor<Name extends StoreConnectionEventName> = Extract<
  StoreConnectionEvent,
  { name: Name }
>["payload"];

export function storeConnectionEvent<Name extends StoreConnectionEventName>(
  name: Name,
  payload: StoreConnectionPayloadFor<Name>,
): { event_name: Name; payload: StoreConnectionPayloadFor<Name> } {
  return { event_name: name, payload } as never;
}

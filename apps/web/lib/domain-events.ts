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

// Sprint 2.10.1 — evento OPERACIONAL (Integration Health), não de domínio:
// os eventos acima (`StoreConnectionValidated`, `StoreConnectionHealthChecked`,
// `StoreAppsDiscovered`) narram o que aconteceu com a Store Connection
// como entidade de negócio; `StoreConnectionCallCompleted` narra uma
// chamada externa individual (Apple/Google), para alimentar métricas
// (latência, success/failure/retry rate) — os dois nunca deveriam ser
// confundidos nem fundidos num só. Nunca inclui credencial, JWT, Private
// Key, Service Account JSON, corpo bruto de resposta ou stack trace —
// `errorCode` é sempre um código estável e sanitizado (nunca a mensagem
// completa nem a resposta do provider).
export type StoreConnectionCallCompletedPayload = {
  provider: "APPLE" | "GOOGLE_PLAY";
  operation: "HEALTH" | "LIST_APPS" | "CONNECT" | "DISCONNECT";
  success: boolean;
  durationMs: number;
  isRetry: boolean;
  errorCode?: string;
};

export type StoreConnectionEvent =
  | { name: "StoreConnectionCreated"; payload: StoreConnectionCreatedPayload }
  | { name: "StoreConnectionUpdated"; payload: StoreConnectionUpdatedPayload }
  | { name: "StoreConnectionValidated"; payload: StoreConnectionValidatedPayload }
  | { name: "StoreConnectionDeleted"; payload: StoreConnectionDeletedPayload }
  | { name: "StoreConnectionHealthChecked"; payload: StoreConnectionHealthCheckedPayload }
  | { name: "StoreAppsDiscovered"; payload: StoreAppsDiscoveredPayload }
  | { name: "StoreConnectionCallCompleted"; payload: StoreConnectionCallCompletedPayload };

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

// Sprint 2.11a — Artifact Storage Foundation. Eventos NUNCA incluem
// conteúdo do binário, signed URL, token ou qualquer credencial — mesma
// disciplina de StoreConnectionEvent. Um evento por transição de estado
// (upload iniciado/armazenado/falhou, validação iniciada/concluída/falhou,
// removido) — nunca um evento por chunk de upload resumível (decisão do
// sprint: eventos narram estado de negócio, não progresso técnico de rede).
export type BuildArtifactUploadStartedPayload = { build_id: string; original_filename: string; size_bytes: number };
export type BuildArtifactStoredPayload = { build_id: string };
export type BuildArtifactUploadFailedPayload = { build_id: string; reason: string };
export type BuildArtifactValidationStartedPayload = { build_id: string };
export type BuildArtifactValidatedPayload = { build_id: string };
export type BuildArtifactValidationFailedPayload = { build_id: string; error_code: string };
export type BuildArtifactRemovedPayload = { build_id: string };

export type BuildArtifactEvent =
  | { name: "BuildArtifactUploadStarted"; payload: BuildArtifactUploadStartedPayload }
  | { name: "BuildArtifactStored"; payload: BuildArtifactStoredPayload }
  | { name: "BuildArtifactUploadFailed"; payload: BuildArtifactUploadFailedPayload }
  | { name: "BuildArtifactValidationStarted"; payload: BuildArtifactValidationStartedPayload }
  | { name: "BuildArtifactValidated"; payload: BuildArtifactValidatedPayload }
  | { name: "BuildArtifactValidationFailed"; payload: BuildArtifactValidationFailedPayload }
  | { name: "BuildArtifactRemoved"; payload: BuildArtifactRemovedPayload };

export type BuildArtifactEventName = BuildArtifactEvent["name"];

type BuildArtifactPayloadFor<Name extends BuildArtifactEventName> = Extract<BuildArtifactEvent, { name: Name }>["payload"];

export function buildArtifactEvent<Name extends BuildArtifactEventName>(
  name: Name,
  payload: BuildArtifactPayloadFor<Name>,
): { event_name: Name; payload: BuildArtifactPayloadFor<Name> } {
  return { event_name: name, payload } as never;
}

// Sprint 2.11b — Google Play AAB Upload. "provider" segue o mesmo
// vocabulário estável já usado em `StoreConnectionCallCompletedPayload`
// (Sprint 2.10.1) — nunca o nome de exibição livre da platform. Payload
// nunca inclui JWT/access token/Service Account JSON/private key/signed
// Storage URL — só o resultado (`editId`/`versionCode`) e metadados de
// observabilidade (`durationMs`/`attempt`/`errorCode` sanitizado).
export type ProviderUploadStartedPayload = { provider: "GOOGLE_PLAY"; buildArtifactId: string; storeConnectionId: string; attempt: number };
export type ProviderUploadSucceededPayload = {
  provider: "GOOGLE_PLAY";
  buildArtifactId: string;
  storeConnectionId: string;
  editId: string;
  versionCode: number;
  durationMs: number;
  attempt: number;
};
export type ProviderUploadFailedPayload = {
  provider: "GOOGLE_PLAY";
  buildArtifactId: string;
  storeConnectionId: string;
  editId: string | null;
  durationMs: number;
  errorCode: string;
  attempt: number;
};
export type ProviderUploadRetriedPayload = { provider: "GOOGLE_PLAY"; buildArtifactId: string; storeConnectionId: string; attempt: number };

export type ProviderUploadEvent =
  | { name: "ProviderUploadStarted"; payload: ProviderUploadStartedPayload }
  | { name: "ProviderUploadSucceeded"; payload: ProviderUploadSucceededPayload }
  | { name: "ProviderUploadFailed"; payload: ProviderUploadFailedPayload }
  | { name: "ProviderUploadRetried"; payload: ProviderUploadRetriedPayload };

export type ProviderUploadEventName = ProviderUploadEvent["name"];

type ProviderUploadPayloadFor<Name extends ProviderUploadEventName> = Extract<ProviderUploadEvent, { name: Name }>["payload"];

export function providerUploadEvent<Name extends ProviderUploadEventName>(
  name: Name,
  payload: ProviderUploadPayloadFor<Name>,
): { event_name: Name; payload: ProviderUploadPayloadFor<Name> } {
  return { event_name: name, payload } as never;
}

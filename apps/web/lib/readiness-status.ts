import type { ReadinessCheck, ReleaseReadiness } from "@agsos/database";

// Rótulos/variantes para o resultado de Release Readiness (Sprint 2.12b) —
// mesmo padrão de apps/web/lib/release-status.ts e submission-status.ts.
//
// Readiness ≠ Submission ≠ Publication (ver DECISIONS.md do 2.12a): este
// arquivo só formata o veredito devolvido por `get_release_readiness`,
// nunca decide nada por conta própria.

// Sprint 2.14 — `SUBMISSION_TARGETS_MISSING` (catálogo 2.12a) só falha
// quando o Release ainda não tem NENHUMA Submission ativa. `blocking=true`
// nesse check é verdade sobre o Release como um todo, mas para a AÇÃO
// "criar a primeira Submission" ele descreve exatamente o que essa ação
// resolve — nunca uma inconsistência a corrigir antes. O RPC (2.12a/2.12c)
// não muda: ele continua reportando `blocking: true` honestamente. Este é
// o único ponto do produto (Submission Gate) que interpreta esse check
// como não-acionável, e é usado tanto pelo botão "Criar Submissão"
// (apps/web/app/publishing/page.tsx) quanto pelo próprio painel
// (readiness-panel.tsx), para os dois nunca discordarem entre si.
export function isSubmissionGateBlocking(check: Pick<ReadinessCheck, "blocking" | "code">): boolean {
  return check.blocking && check.code !== "SUBMISSION_TARGETS_MISSING";
}

export function isReadyForSubmissionGate(readiness: ReleaseReadiness | null | undefined): boolean {
  if (!readiness) return false;
  return !readiness.checks.some(isSubmissionGateBlocking);
}

export function readinessStatusLabel(status: "READY" | "NOT_READY"): string {
  return status === "READY" ? "Pronto para submissão" : "Não pronto";
}

export function readinessStatusVariant(status: "READY" | "NOT_READY"): "success" | "destructive" {
  return status === "READY" ? "success" : "destructive";
}

export function checkStatusLabel(status: ReadinessCheck["status"]): string {
  switch (status) {
    case "PASS":
      return "OK";
    case "FAIL":
      return "Falhou";
    case "WARN":
      return "Atenção";
    case "NOT_APPLICABLE":
      return "Não avaliado";
    default:
      return status;
  }
}

// "Corrigir" é deliberadamente genérico (ver limite de escopo do 2.12b) —
// só os casos mais comuns e inequívocos ganham deep link real; os demais
// checks continuam totalmente visíveis, só sem atalho de navegação.
//
// Sprint 2.15 — METADATA_LISTING_MISSING/METADATA_PACKAGE_NAME_MISSING/
// METADATA_BUNDLE_IDENTIFIER_MISSING agora têm uma superfície real que
// resolve o blocker (Game → Store Listing, `components/games/
// store-listing-card.tsx`, id="store-listing"): `entityId` desses três
// checks é sempre o `game_id` (RPC `get_release_readiness`, entityType
// "GAME") — deep link preciso em vez de mandar para a lista genérica
// `/games`. Os demais checks não relacionados a listing/identificadores
// não foram alterados.
export function readinessFixHref(check: ReadinessCheck): string | null {
  switch (check.code) {
    case "STORE_CONNECTION_MISSING":
    case "STORE_CONNECTION_INVALID":
    case "STORE_CONNECTION_CREDENTIALS_MISSING":
      return "/settings/store-connections";
    case "METADATA_LISTING_MISSING":
    case "METADATA_PACKAGE_NAME_MISSING":
    case "METADATA_BUNDLE_IDENTIFIER_MISSING":
      return check.entityId ? `/games/${check.entityId}#store-listing` : "/games";
    case "ARTIFACT_MISSING":
    case "ARTIFACT_WRONG_FORMAT":
    case "ARTIFACT_NOT_STORED":
    case "ARTIFACT_INVALID":
    case "BUILD_NOT_SUCCEEDED":
      return "/games";
    default:
      return null;
  }
}

export function readinessFixLabel(check: ReadinessCheck): string {
  return readinessFixHref(check) ? "Corrigir" : "";
}

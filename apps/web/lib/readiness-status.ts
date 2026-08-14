import type { ReadinessCheck } from "@agsos/database";

// Rótulos/variantes para o resultado de Release Readiness (Sprint 2.12b) —
// mesmo padrão de apps/web/lib/release-status.ts e submission-status.ts.
//
// Readiness ≠ Submission ≠ Publication (ver DECISIONS.md do 2.12a): este
// arquivo só formata o veredito devolvido por `get_release_readiness`,
// nunca decide nada por conta própria.

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
// só os dois casos mais comuns e inequívocos ganham deep link real; os
// demais checks continuam totalmente visíveis, só sem atalho de navegação.
export function readinessFixHref(check: ReadinessCheck): string | null {
  switch (check.code) {
    case "STORE_CONNECTION_MISSING":
    case "STORE_CONNECTION_INVALID":
    case "STORE_CONNECTION_CREDENTIALS_MISSING":
      return "/settings/store-connections";
    case "METADATA_PACKAGE_NAME_MISSING":
    case "METADATA_BUNDLE_IDENTIFIER_MISSING":
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

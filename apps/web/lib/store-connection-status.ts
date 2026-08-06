import type { IntegrationStatus } from "@agsos/database";
import type { IntegrationHealthStatus } from "./integration-health";

// Rótulos em português para o enum `integration_status` do banco
// (Sprint 2.9) — mesmo padrão de apps/web/lib/game-status.ts.
const LABELS: Record<IntegrationStatus, string> = {
  DISCONNECTED: "Desconectado",
  CONNECTING: "Conectando",
  CONNECTED: "Conectado",
  DEGRADED: "Degradado",
  ERROR: "Erro",
  DISABLED: "Desabilitado",
};

const VARIANTS: Record<IntegrationStatus, "default" | "warning" | "success" | "destructive" | "outline"> = {
  DISCONNECTED: "outline",
  CONNECTING: "default",
  CONNECTED: "success",
  DEGRADED: "warning",
  ERROR: "destructive",
  DISABLED: "outline",
};

export function storeConnectionStatusLabel(status: IntegrationStatus): string {
  return LABELS[status];
}

export function storeConnectionStatusVariant(status: IntegrationStatus): "default" | "warning" | "success" | "destructive" | "outline" {
  return VARIANTS[status];
}

// Sprint 2.10.1 — vocabulário de Integration Health (`IntegrationHealthStatus`,
// calculado a partir do histórico de chamadas), separado de cima
// (`IntegrationStatus`, coluna do banco) por definição — nunca confundir.
const HEALTH_LABELS: Record<IntegrationHealthStatus, string> = {
  NOT_VALIDATED: "Nunca validado",
  HEALTHY: "Saudável",
  DEGRADED: "Degradado",
  ERROR: "Com erro",
  DISCONNECTED: "Desconectado",
};

const HEALTH_VARIANTS: Record<IntegrationHealthStatus, "default" | "warning" | "success" | "destructive" | "outline"> = {
  NOT_VALIDATED: "outline",
  HEALTHY: "success",
  DEGRADED: "warning",
  ERROR: "destructive",
  DISCONNECTED: "outline",
};

export function integrationHealthStatusLabel(status: IntegrationHealthStatus): string {
  return HEALTH_LABELS[status];
}

export function integrationHealthStatusVariant(status: IntegrationHealthStatus): "default" | "warning" | "success" | "destructive" | "outline" {
  return HEALTH_VARIANTS[status];
}

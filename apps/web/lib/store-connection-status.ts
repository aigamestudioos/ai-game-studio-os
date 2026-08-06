import type { IntegrationStatus } from "@agsos/database";

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

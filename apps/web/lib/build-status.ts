// Rótulos em português para o enum `build_status` do banco (Sprint 2.1).
const LABELS: Record<string, string> = {
  PENDING: "Pendente",
  RUNNING: "Em build",
  SUCCEEDED: "Pronta",
  FAILED: "Falhou",
  CANCELLED: "Cancelada",
};

export function buildStatusLabel(status: string): string {
  return LABELS[status] ?? status;
}

// Rótulos em português para o enum `build_type` do banco (Sprint 2.4/2.5).
const TYPE_LABELS: Record<string, string> = {
  DEBUG: "Debug",
  RELEASE: "Release",
  INTERNAL: "Interno",
  PRODUCTION: "Produção",
};

export function buildTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

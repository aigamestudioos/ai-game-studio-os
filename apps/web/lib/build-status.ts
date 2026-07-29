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

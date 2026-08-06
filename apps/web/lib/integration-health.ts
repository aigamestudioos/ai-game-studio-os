import type { StoreConnectionCallCompletedPayload } from "./domain-events";

// Integration Health (Sprint 2.10.1) — agregação read-side sobre eventos
// `StoreConnectionCallCompleted` já persistidos em `studio_events`. Nunca
// lê nem grava nada aqui — funções puras, testáveis sem banco, chamadas
// pela Server Action que de fato busca os eventos (ver `health-actions.ts`).

export type CallCompletedEvent = {
  payload: StoreConnectionCallCompletedPayload;
  occurred_at: string;
};

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

// Vocabulário oficial (definido pelo usuário, Sprint 2.10.1) — nunca
// confundir com `IntegrationStatus` (`store_connections.status`, banco):
// aquele é o estado da conexão como entidade; este é o estado de saúde
// operacional calculado a partir do histórico de chamadas.
export type IntegrationHealthStatus = "NOT_VALIDATED" | "HEALTHY" | "DEGRADED" | "ERROR" | "DISCONNECTED";

export function computeIntegrationHealthStatus(params: {
  connectionDisconnected: boolean;
  calls: CallCompletedEvent[];
  now?: number;
}): IntegrationHealthStatus {
  if (params.connectionDisconnected) return "DISCONNECTED";
  if (params.calls.length === 0) return "NOT_VALIDATED";

  const now = params.now ?? Date.now();
  const sorted = [...params.calls].sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at));
  const last = sorted[sorted.length - 1]!;
  if (!last.payload.success) return "ERROR";

  const dayAgo = now - ONE_DAY_MS;
  const hadFailureLast24h = sorted.some((c) => !c.payload.success && Date.parse(c.occurred_at) >= dayAgo);
  return hadFailureLast24h ? "DEGRADED" : "HEALTHY";
}

export type WindowMetrics = {
  totalCalls: number;
  successCount: number;
  failureCount: number;
  // null (não 0) quando não há chamadas na janela — 0% de sucesso de 0
  // chamadas seria enganoso, "sem dado" é diferente de "sempre falhou".
  successRate: number | null;
  failureRate: number | null;
  retryCount: number;
  retryRate: number | null;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
};

export function aggregateCallWindow(calls: CallCompletedEvent[], windowMs: number, now: number = Date.now()): WindowMetrics {
  const cutoff = now - windowMs;
  const inWindow = calls.filter((c) => Date.parse(c.occurred_at) >= cutoff);
  const totalCalls = inWindow.length;
  const successCount = inWindow.filter((c) => c.payload.success).length;
  const failureCount = totalCalls - successCount;
  const retryCount = inWindow.filter((c) => c.payload.isRetry).length;

  const durations = inWindow.map((c) => c.payload.durationMs).sort((a, b) => a - b);
  const avgLatencyMs = durations.length ? durations.reduce((sum, d) => sum + d, 0) / durations.length : null;
  // p95 por índice, sem biblioteca — correto o suficiente para o volume
  // esperado (chamadas de Validate Connection, não telemetria de alto
  // volume); reavaliar só se isso deixar de ser verdade.
  const p95LatencyMs = durations.length
    ? (durations[Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1)] ?? null)
    : null;

  return {
    totalCalls,
    successCount,
    failureCount,
    successRate: totalCalls ? successCount / totalCalls : null,
    failureRate: totalCalls ? failureCount / totalCalls : null,
    retryCount,
    retryRate: totalCalls ? retryCount / totalCalls : null,
    avgLatencyMs,
    p95LatencyMs,
  };
}

export type LastCheck = {
  provider: "APPLE" | "GOOGLE_PLAY";
  success: boolean;
  occurredAt: string;
  durationMs: number;
  errorCode?: string;
} | null;

export function lastCheckOf(calls: CallCompletedEvent[]): LastCheck {
  if (calls.length === 0) return null;
  const last = [...calls].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))[0]!;
  return {
    provider: last.payload.provider,
    success: last.payload.success,
    occurredAt: last.occurred_at,
    durationMs: last.payload.durationMs,
    errorCode: last.payload.errorCode,
  };
}

export type ConnectionHealthSummary = {
  storeConnectionId: string;
  provider: "APPLE" | "GOOGLE_PLAY";
  status: IntegrationHealthStatus;
  window24h: WindowMetrics;
  window7d: WindowMetrics;
  lastCheck: LastCheck;
  recentCalls: CallCompletedEvent[];
};

export function buildConnectionHealthSummary(params: {
  storeConnectionId: string;
  provider: "APPLE" | "GOOGLE_PLAY";
  connectionDisconnected: boolean;
  calls: CallCompletedEvent[];
  now?: number;
  recentLimit?: number;
}): ConnectionHealthSummary {
  const now = params.now ?? Date.now();
  const status = computeIntegrationHealthStatus({ connectionDisconnected: params.connectionDisconnected, calls: params.calls, now });
  const recentCalls = [...params.calls]
    .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
    .slice(0, params.recentLimit ?? 10);

  return {
    storeConnectionId: params.storeConnectionId,
    provider: params.provider,
    status,
    window24h: aggregateCallWindow(params.calls, ONE_DAY_MS, now),
    window7d: aggregateCallWindow(params.calls, SEVEN_DAYS_MS, now),
    lastCheck: lastCheckOf(params.calls),
    recentCalls,
  };
}

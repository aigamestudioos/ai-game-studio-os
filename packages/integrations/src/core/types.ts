// Framework compartilhado de integrações (AGSOS-SPEC-008 §3). Sprint 2.10
// — extraído do adapter Apple (Sprint 2.9) para não duplicar em cada
// provider novo (Google Play agora; Steam/Epic/Nintendo/RevenueCat/etc.
// no futuro seguem o mesmo contrato).

// `code` (Sprint 2.10.1) é opcional e só existe para instrumentação de
// métricas (Integration Health) — nunca faz parte do contrato exibido ao
// usuário, que continua sendo só `error` (mensagem sanitizada).
export type HealthResult = { ok: true } | { ok: false; error: string; code?: string };

export type ListResult<T> = { ok: true; items: T[] } | { ok: false; error: string; code?: string };

export type ItemResult<T> = { ok: true; item: T } | { ok: false; error: string; code?: string };

// Contrato base de todo adapter de integração — connect()/disconnect() são
// no-ops para providers stateless por chamada (Apple, Google: cada request
// carrega sua própria credencial/token, não existe "sessão" para abrir/
// fechar), mas o contrato garante que todo adapter futuro tenha esses 3
// métodos, mesmo que alguns sejam triviais.
export interface IntegrationAdapter {
  connect(): Promise<HealthResult>;
  disconnect(): Promise<void>;
  health(): Promise<HealthResult>;
}

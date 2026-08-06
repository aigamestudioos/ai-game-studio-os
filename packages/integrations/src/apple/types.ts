import type { HealthResult, IntegrationAdapter, ItemResult, ListResult } from "../core/types";

// Apple App Store Connect — Adapter Pattern (AGSOS-SPEC-008 §3). Sprint 2.9;
// retrofit sobre `core/types.ts` no Sprint 2.10 (framework compartilhado).

export type AppleCredentials = {
  issuerId: string;
  keyId: string;
  teamId: string;
  /** Conteúdo do arquivo .p8 (PEM), nunca um caminho de arquivo. */
  privateKey: string;
};

export type AppleApp = {
  id: string;
  name: string;
  bundleId: string;
  sku: string;
};

// connect()/disconnect() são no-ops para Apple (API stateless por chamada,
// autenticada via JWT assinado a cada requisição; não existe "sessão" para
// abrir/fechar) — o contrato (`IntegrationAdapter`) é o mesmo de todo
// provider, mesmo quando alguns métodos são triviais para um provider
// específico.
export interface ApplePublishingAdapter extends IntegrationAdapter {
  listApps(): Promise<ListResult<AppleApp>>;
  getApp(appId: string): Promise<ItemResult<AppleApp>>;
}

export type { HealthResult };

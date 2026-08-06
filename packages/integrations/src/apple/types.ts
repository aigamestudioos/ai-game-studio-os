// Apple App Store Connect — Adapter Pattern (AGSOS-SPEC-008 §3). Sprint 2.9.

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

export type AdapterHealthResult = { ok: true } | { ok: false; error: string };

export type AdapterListAppsResult = { ok: true; apps: AppleApp[] } | { ok: false; error: string };

// Contrato base de todo adapter de integração (AGSOS-SPEC-008 §3,
// `IntegrationAdapter`) — connect()/disconnect() aqui são no-ops para Apple
// (a API é stateless por chamada, autenticada via JWT assinado a cada
// requisição; não existe "sessão" para abrir/fechar), mas o contrato é
// mantido para os adapters futuros (Google Play, etc.) que possam precisar
// de verdade.
export interface ApplePublishingAdapter {
  connect(): Promise<AdapterHealthResult>;
  disconnect(): Promise<void>;
  health(): Promise<AdapterHealthResult>;
  listApps(): Promise<AdapterListAppsResult>;
  getApp(appId: string): Promise<{ ok: true; app: AppleApp } | { ok: false; error: string }>;
}

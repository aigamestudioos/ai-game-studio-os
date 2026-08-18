import type { HealthResult, IntegrationAdapter, ItemResult, ListResult } from "../core/types";

// Google Play Developer API (Android Publisher API v3) — Adapter Pattern
// (AGSOS-SPEC-008 §3). Sprint 2.10.
//
// Diferença real em relação à Apple, verificada antes de implementar (não
// assumida): a Android Publisher API não tem nenhum endpoint "listar meus
// apps" — todo recurso (`edits`, `bundles`, `listings`...) vive sob
// `applications/{packageName}/...`, exige saber o package name de
// antemão. Por isso `packageName` é campo obrigatório da credencial (não
// existe para a Apple), e `listApps()` nunca retorna uma lista descoberta
// de verdade — só o único app configurado, uma vez que a validação
// confirme acesso a ele. Documentado aqui para não ser confundido com uma
// limitação de implementação; é uma limitação da API do Google.
export type GoogleCredentials = {
  /** Conteúdo bruto do JSON da Service Account (client_email/private_key/token_uri), nunca um caminho de arquivo. */
  serviceAccountJson: string;
  packageName: string;
};

export type GoogleApp = {
  id: string;
  name: string;
  packageName: string;
};

// Sprint 2.11b — Google Play AAB Upload. `GoogleBundle` espelha o recurso
// `Bundle` da Android Publisher API v3 (resposta de `edits.bundles.upload`)
// — só os campos que este sprint de fato usa (`versionCode`), nunca o
// corpo bruto da resposta (nenhum outro campo é persistido/exibido).
export type GoogleBundle = { versionCode: number };

export type GoogleResumableChunkResult =
  | { status: "complete"; versionCode: number }
  | { status: "incomplete"; bytesReceived: number };

// Sprint 2.16b — mirrors `Track`/`TrackRelease` da Android Publisher API v3.
export type GoogleTrackRelease = {
  name?: string;
  versionCodes?: string[];
  status?: "draft" | "inProgress" | "halted" | "completed";
  releaseNotes?: { language: string; text: string }[];
};
export type GoogleTrack = { track: string; releases: GoogleTrackRelease[] };

export interface GooglePlayPublishingAdapter extends IntegrationAdapter {
  listApps(): Promise<ListResult<GoogleApp>>;
  // Cria um Edit rascunho — obrigatório antes de qualquer upload
  // (`edits.bundles.upload` sempre exige um `editId` existente).
  // Sprint 2.16c — `baseUrl` opcional (bugfix, ver `client.ts#createGoogleEdit`).
  createEdit(baseUrl?: string): Promise<ItemResult<{ editId: string }>>;
  // Upload simples (não resumível) — mantido só para compatibilidade com
  // fixtures/testes pequenos (Sprint 2.11b). O fluxo real de envio
  // (Sprint 2.11d) usa `createResumableSession`/`uploadResumableChunk`.
  uploadBundle(editId: string, bundle: Buffer): Promise<ItemResult<GoogleBundle>>;
  // Sempre chamado depois do upload (sucesso ou falha) — nunca deixa um
  // Edit pendurado (DECISIONS.md: Play Console permite só 1 Edit ativo
  // por app). Best-effort: falha aqui nunca deveria mascarar o resultado
  // real do upload.
  deleteEdit(editId: string): Promise<void>;

  // Sprint 2.11d — upload resumível real. `sessionUri` é uma bearer
  // capability (DECISIONS.md) — nunca logada, nunca em domain event, só
  // persistida via referência a segredo (Vault), nunca plaintext.
  createResumableSession(editId: string, totalBytes: number, mimeType: string): Promise<ItemResult<{ sessionUri: string }>>;
  uploadResumableChunk(sessionUri: string, chunk: Buffer, startByte: number, totalBytes: number): Promise<ItemResult<GoogleResumableChunkResult>>;
  queryResumableProgress(sessionUri: string, totalBytes: number): Promise<ItemResult<GoogleResumableChunkResult>>;

  // Sprint 2.16b — etapa final do fluxo de Submission (GATE 9/10/11).
  // `baseUrl` opcional em todos os quatro: usado exclusivamente pelos
  // testes de integração para apontar o adapter ao fake provider server;
  // nunca setado fora de teste (produção sempre usa o Android Publisher
  // real).
  getEdit(editId: string, baseUrl?: string): Promise<ItemResult<{ editId: string; expiryTimeSeconds: string | null }>>;
  getTrack(editId: string, track: string, baseUrl?: string): Promise<ItemResult<GoogleTrack>>;
  updateTrack(editId: string, track: GoogleTrack, baseUrl?: string): Promise<ItemResult<GoogleTrack>>;
  commitEdit(editId: string, baseUrl?: string): Promise<ItemResult<{ editId: string }>>;
}

export type { HealthResult, ItemResult };

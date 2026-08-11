import type { HealthResult, IntegrationAdapter, ItemResult, ListResult } from "../core/types";

// Sprint 2.11c — Apple IPA / Build Uploads API. Contrato confirmado contra
// a documentação oficial atual da App Store Connect API (não por memória):
// developer.apple.com/documentation/appstoreconnectapi/build-uploads
// (disponível desde a versão 4.1 da API).
export type AppleBuildUploadState = "AWAITING_UPLOAD" | "PROCESSING" | "FAILED" | "COMPLETE";
export type ApplePlatform = "IOS" | "MAC_OS" | "TV_OS" | "VISION_OS";

// Espelha `DeliveryFileUploadOperation` — nunca persistir isto (url/headers
// podem ser sensíveis/temporários, decisão do sprint).
export type AppleUploadOperation = {
  method: string | null;
  url: string | null;
  offset: number | null;
  length: number | null;
  requestHeaders: { name: string; value: string }[] | null;
  partNumber: number | null;
};

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

  // Sprint 2.11c — Build Uploads API. Nomes seguem a documentação oficial
  // (BuildUpload/BuildUploadFile), não uma tradução livre.
  createBuildUpload(params: {
    appId: string;
    platform: ApplePlatform;
    cfBundleVersion: string;
    cfBundleShortVersionString: string;
  }): Promise<ItemResult<{ buildUploadId: string; state: AppleBuildUploadState }>>;

  reserveBuildUploadFile(params: {
    buildUploadId: string;
    fileName: string;
    fileSize: number;
    uti: string;
  }): Promise<ItemResult<{ buildUploadFileId: string; uploadOperations: AppleUploadOperation[] }>>;

  // Executa cada `uploadOperation` na ordem recebida, cortando `fileBuffer`
  // por `offset`/`length` — nunca em paralelo (decisão do sprint), nunca
  // anexa headers próprios além dos fornecidos pela Apple (`method`/`url`/
  // `requestHeaders` são sempre os da Apple — nunca o JWT/Authorization da
  // App Store Connect, que não deve ir para essas URLs).
  uploadBuildUploadFileOperations(operations: AppleUploadOperation[], fileBuffer: Buffer): Promise<ItemResult<void>>;

  commitBuildUploadFile(buildUploadFileId: string): Promise<ItemResult<void>>;

  getBuildUpload(buildUploadId: string): Promise<ItemResult<{ state: AppleBuildUploadState }>>;

  deleteBuildUpload(buildUploadId: string): Promise<void>;
}

export type { HealthResult };

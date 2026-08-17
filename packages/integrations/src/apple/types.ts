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
  // Sprint 2.11d — `opts.startIndex` retoma depois de um crash sem
  // reenviar operações já confirmadas; `opts.onOperationComplete` é o
  // gancho para persistir checkpoint (ver `integration_jobs.checkpoint`).
  uploadBuildUploadFileOperations(
    operations: AppleUploadOperation[],
    fileBuffer: Buffer,
    opts?: { startIndex?: number; onOperationComplete?: (index: number) => Promise<void> | void },
  ): Promise<ItemResult<void>>;

  commitBuildUploadFile(buildUploadFileId: string): Promise<ItemResult<void>>;

  getBuildUpload(buildUploadId: string): Promise<ItemResult<{ state: AppleBuildUploadState }>>;

  deleteBuildUpload(buildUploadId: string): Promise<void>;

  // Sprint 2.16b — Review Submission (GATE 12/14/15). `baseUrl` opcional em
  // todos: usado só nos testes de integração para apontar o adapter ao
  // fake provider server.
  listReviewSubmissions(
    params: { appId: string; platform: ApplePlatform },
    baseUrl?: string,
  ): Promise<ListResult<{ id: string; state: string | null }>>;
  createReviewSubmission(
    params: { appId: string; platform: ApplePlatform },
    baseUrl?: string,
  ): Promise<ItemResult<{ reviewSubmissionId: string; state: string | null }>>;
  createReviewSubmissionItem(
    params: { reviewSubmissionId: string; buildId: string },
    baseUrl?: string,
  ): Promise<ItemResult<{ reviewSubmissionItemId: string }>>;
  submitReviewSubmission(
    reviewSubmissionId: string,
    baseUrl?: string,
  ): Promise<ItemResult<{ reviewSubmissionId: string; state: string | null }>>;
  getReviewSubmission(
    reviewSubmissionId: string,
    baseUrl?: string,
  ): Promise<ItemResult<{ reviewSubmissionId: string; state: string | null }>>;
}

export type { HealthResult };

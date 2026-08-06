import type { HealthResult, IntegrationAdapter, ListResult } from "../core/types";

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

export interface GooglePlayPublishingAdapter extends IntegrationAdapter {
  listApps(): Promise<ListResult<GoogleApp>>;
}

export type { HealthResult };

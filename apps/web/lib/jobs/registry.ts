import { appleAppStoreProcessor } from "./processors/apple-app-store";
import { googlePlayProcessor } from "./processors/google-play";
import { submissionAppleProcessor } from "./processors/submission-apple";
import { submissionGooglePlayProcessor } from "./processors/submission-google-play";
import { testEchoProcessor } from "./processors/test-echo";
import type { IntegrationJobProcessor } from "./types";

// Sprint 2.11d-2 — registro de processors por `integration_name`. `test`
// nunca deve receber um job real em produção — nenhuma Server Action/RPC
// hoje cria job com `integration_name = "test"`, só os testes empíricos
// deste sprint o fazem manualmente via `enqueue_provider_upload_job`.
const processors: Record<string, IntegrationJobProcessor> = {
  test: testEchoProcessor,
  // Sprint 2.11d-2c — transporte de artifact (provider_upload).
  google_play: googlePlayProcessor,
  // Sprint 2.11d-2d — transporte de artifact (provider_upload).
  apple_app_store: appleAppStoreProcessor,
  // Sprint 2.16b/c — execução de Submission (`transition_submission`
  // action=SUBMIT/RETRY), integration_name distinto do transporte por
  // desenho: são jobs de tipos diferentes (`submission_id` vs.
  // `provider_upload_id`), nunca devem ser resolvidos pelo mesmo
  // processor mesmo tendo o mesmo provider por trás.
  submission_google_play: submissionGooglePlayProcessor,
  submission_apple: submissionAppleProcessor,
};

export function getIntegrationJobProcessor(integrationName: string): IntegrationJobProcessor | null {
  return processors[integrationName] ?? null;
}

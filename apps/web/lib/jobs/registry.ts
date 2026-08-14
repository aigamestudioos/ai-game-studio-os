import { appleAppStoreProcessor } from "./processors/apple-app-store";
import { googlePlayProcessor } from "./processors/google-play";
import { testEchoProcessor } from "./processors/test-echo";
import type { IntegrationJobProcessor } from "./types";

// Sprint 2.11d-2 — registro de processors por `integration_name`. `test`
// nunca deve receber um job real em produção — nenhuma Server Action/RPC
// hoje cria job com `integration_name = "test"`, só os testes empíricos
// deste sprint o fazem manualmente via `enqueue_provider_upload_job`.
const processors: Record<string, IntegrationJobProcessor> = {
  test: testEchoProcessor,
  // Sprint 2.11d-2c.
  google_play: googlePlayProcessor,
  // Sprint 2.11d-2d.
  apple_app_store: appleAppStoreProcessor,
};

export function getIntegrationJobProcessor(integrationName: string): IntegrationJobProcessor | null {
  return processors[integrationName] ?? null;
}

import { testEchoProcessor } from "./processors/test-echo";
import type { IntegrationJobProcessor } from "./types";

// Sprint 2.11d-2 — registro de processors por `integration_name`. Google
// (2.11d-2c) e Apple (2.11d-2d) se registram aqui quando os workers reais
// existirem. `test` nunca deve receber um job real em produção — nenhuma
// Server Action/RPC hoje cria job com `integration_name = "test"`, só os
// testes empíricos deste sprint o fazem manualmente via `enqueue_provider_upload_job`.
const processors: Record<string, IntegrationJobProcessor> = {
  test: testEchoProcessor,
};

export function getIntegrationJobProcessor(integrationName: string): IntegrationJobProcessor | null {
  return processors[integrationName] ?? null;
}

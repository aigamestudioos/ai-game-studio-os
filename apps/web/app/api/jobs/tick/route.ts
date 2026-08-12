import { NextResponse, type NextRequest } from "next/server";
import { isValidDispatcherSecret } from "../../../../lib/jobs/dispatcher-auth";
import { runDispatcherTick } from "../../../../lib/jobs/dispatcher";

// Sprint 2.11d-2 (GATEs 6/7/9) — endpoint do dispatcher, chamado por
// `pg_cron`→`pg_net` (ver `20260814000002_pg_cron_dispatcher_schedule.sql`)
// a cada minuto. NÃO é uma fila — é só uma execução bounded que reivindica
// trabalho já persistido em `integration_jobs`. Runtime Node (não Edge):
// usa `node:crypto`/admin client, incompatíveis com Edge.
export const runtime = "nodejs";
// GATE 9 — orçamento de tempo do dispatcher (`DEFAULT_TIME_BUDGET_MS` em
// `lib/jobs/dispatcher.ts`) é 45s com 5s de margem = 40s de trabalho real;
// 60s aqui dá margem adicional para autenticação/serialização da resposta
// sem se aproximar do limite da plataforma.
export const maxDuration = 60;

const MAX_BODY_BYTES = 1024;

export async function POST(request: NextRequest) {
  // GATE 7 — auditoria de método/Content-Type/tamanho antes de qualquer
  // trabalho. Content-Type é exigido mesmo que o corpo seja `{}` — reduz
  // superfície para chamadas acidentais/mal-formadas de fora do `pg_net`.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "unsupported_content_type" }, { status: 415 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  // GATE 7 — comparação resistente a timing attack; nunca ecoar o secret
  // recebido na resposta/log em nenhum caminho (sucesso ou falha).
  const receivedSecret = request.headers.get("x-dispatcher-secret");
  if (!isValidDispatcherSecret(receivedSecret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const summary = await runDispatcherTick();

  // Resposta nunca inclui checkpoint bruto (pode conter estado de
  // provider como índices/URIs de progresso não-sensíveis, mas não há
  // motivo para expor isso por HTTP também) — só o resumo operacional já
  // sanitizado por `runDispatcherTick`.
  return NextResponse.json({ ok: true, ...summary });
}

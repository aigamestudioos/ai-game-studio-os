"use server";

// Sprint 2.16a — Server Action de escrita para transições de Submission
// (PREPARE/SUBMIT/RETRY). Mesmo padrão de `readiness-actions.ts`
// (Sprint 2.12b): nunca recebe/repassa `studio_id` do client, só autentica
// a sessão e deixa `transition_submission` (RPC SECURITY DEFINER) decidir
// autorização/readiness/estado — a Server Action é só o transporte
// autenticado, toda a lógica de negócio vive no Postgres (GATE 7 do
// Sprint 2.16).
import { cookies } from "next/headers";
import { createServerClient, createSubmissionsRepository } from "@agsos/database";

async function getAuthorizedServerClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });
}

// Mensagens de erro do Postgres nunca são repassadas cruas ao client
// (GATE 17/26 — erro bruto pode ir para observabilidade segura, nunca
// direto à UI) — mapeamento mínimo para os códigos que
// `transition_submission` pode levantar.
function mapTransitionError(message: string): string {
  if (message.includes("READINESS_NOT_READY")) return "A Release não está pronta para envio — revise o painel de Readiness.";
  if (message.includes("PLATFORM_NOT_SUPPORTED")) return "Esta plataforma ainda não tem pipeline de envio.";
  if (message.includes("sem permissão publishing.submit")) return "Você não tem permissão para enviar Submissions.";
  if (message.includes("não pertence ao Studio")) return "Submissão não encontrada.";
  if (message.includes("já existe um job de envio ativo")) return "Já existe um envio em andamento para esta Submission.";
  if (message.includes("transição inválida")) return "Esta ação não é permitida no estado atual da Submissão.";
  return "Não foi possível concluir a ação. Tente novamente.";
}

export async function transitionSubmissionAction(
  submissionId: string,
  action: "PREPARE" | "SUBMIT" | "RETRY",
): Promise<{ error?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  try {
    await createSubmissionsRepository(serverClient).transition(submissionId, action, user.id);
    return {};
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return { error: mapTransitionError(message) };
  }
}

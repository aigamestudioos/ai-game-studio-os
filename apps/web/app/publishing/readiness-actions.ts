"use server";

// Sprint 2.12b — GATE 7: Server Action de leitura para Release Readiness.
//
// `get_release_readiness` (Sprint 2.12a) já deriva `studio_id` a partir da
// própria Release no servidor e falha alto se a Release não pertence ao
// Studio do usuário atual — esta action nunca recebe nem repassa
// `studio_id` do client, só autentica a sessão (mesmo padrão de
// `getAuthorizedServerClient` já usado em
// app/games/[id]/versions/[versionId]/provider-upload-actions.ts) e deixa
// o RPC decidir autorização.
import { cookies } from "next/headers";
import { createReadinessRepository, createServerClient, type ReleaseReadiness } from "@agsos/database";

async function getAuthorizedServerClient() {
  const cookieStore = await cookies();
  return createServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => cookieStore.set(name, value, options),
  });
}

export async function getReleaseReadinessAction(
  releaseId: string,
): Promise<{ data?: ReleaseReadiness; error?: string }> {
  const serverClient = await getAuthorizedServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  try {
    const data = await createReadinessRepository(serverClient).getReleaseReadiness(releaseId);
    return { data };
  } catch {
    return { error: "Não foi possível calcular o readiness deste Release." };
  }
}

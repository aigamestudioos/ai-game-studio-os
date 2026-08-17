import { env } from "../env";

// Sprint 2.16b — GATE 16 PRODUCTION GUARD (segunda camada, independente de
// `env.allowStoreMutation`). Nenhuma chamada real de mutação de loja
// (Google `edits.commit`/`tracks.update`, Apple `reviewSubmissions`
// create/submit) acontece a menos que AMBAS as camadas autorizem:
//
//   1. `AGSOS_ALLOW_STORE_MUTATION=true`   (Sprint 2.16 original)
//   2. o `baseUrl` de destino estar na allowlist explícita
//      `AGSOS_STORE_MUTATION_BASE_URL_ALLOWLIST` (esta função)
//
// Objetivo: mesmo que alguém ligue a flag (1) localmente — por exemplo
// para rodar os testes de integração contra o fake provider server — a
// ausência de (2) continua bloqueando qualquer host real do Google/Apple.
// Falha SEMPRE fechada: lista vazia/ausente = nenhum host permitido,
// mesmo com (1) ligado.
export type StoreMutationGuardResult = { allowed: true; baseUrl: string } | { allowed: false; reason: string };

export function checkStoreMutationGuard(baseUrl: string): StoreMutationGuardResult {
  if (!env.allowStoreMutation) {
    return { allowed: false, reason: "AGSOS_ALLOW_STORE_MUTATION não está ligado." };
  }
  const allowlist = env.storeMutationBaseUrlAllowlist;
  if (allowlist.length === 0) {
    return { allowed: false, reason: "Allowlist de baseUrl vazia — fail-closed." };
  }
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return { allowed: false, reason: "baseUrl inválido." };
  }
  const isAllowed = allowlist.some((entry) => {
    try {
      return new URL(entry).origin === origin;
    } catch {
      return entry === origin;
    }
  });
  if (!isAllowed) {
    return { allowed: false, reason: `Host ${origin} não está na allowlist de mutação de loja.` };
  }
  return { allowed: true, baseUrl };
}

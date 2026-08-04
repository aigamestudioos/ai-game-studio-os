import type { BuildsRow } from "@agsos/database";

// Sprint 2.5 (hardening) — parâmetros centralizados da simulação de Build.
// Não há CI/CD real ainda: a progressão de status é feita por `setTimeout`
// no client (ver apps/web/hooks/use-game-version.ts), então ela só avança
// enquanto a aba que criou a Build permanece aberta. Um reload, fechar a
// aba, ou navegar para outra página mata o timer pendente e a Build fica
// presa em RUNNING para sempre, sem nada no servidor para completá-la —
// limitação conhecida, registrada em IMPLEMENTATION_LOG.md, não corrigida
// por um pipeline real neste sprint (fora de escopo, por decisão explícita).
export const BUILD_SIMULATION_RUNNING_DELAY_MS = 1_500;
export const BUILD_SIMULATION_SUCCEEDED_DELAY_MS = 3_000; // contado a partir de RUNNING

// Limite usado para identificar uma Build "travada": bem acima do tempo
// total da simulação (1.5s + 3s = 4.5s) para não gerar falso positivo por
// latência de rede, mas curto o suficiente para não deixar o usuário
// esperando indefinidamente por um estado que nunca vai progredir sozinho.
export const BUILD_SIMULATION_STUCK_THRESHOLD_MS = 20_000;

export function isBuildStuck(build: Pick<BuildsRow, "status" | "updated_at">): boolean {
  if (build.status !== "RUNNING") return false;
  return Date.now() - new Date(build.updated_at).getTime() > BUILD_SIMULATION_STUCK_THRESHOLD_MS;
}

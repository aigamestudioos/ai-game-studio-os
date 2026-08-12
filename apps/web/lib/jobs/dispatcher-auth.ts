import { timingSafeEqual } from "node:crypto";
import { env } from "../env";

// Sprint 2.11d-2 (GATE 7) — `/api/jobs/tick` não pode ser endpoint público
// operacional. `timingSafeEqual` exige buffers do mesmo tamanho — por isso
// o padding: sem isso, a comparação vazaria o comprimento do segredo
// correto via early-exit de `!==` num `crypto.timingSafeEqual` que lança em
// vez de retornar `false` quando os tamanhos diferem. Nunca logar o
// resultado da comparação junto com o valor recebido.
export function isValidDispatcherSecret(receivedSecret: string | null): boolean {
  if (!receivedSecret) return false;

  const expected = Buffer.from(env.jobsDispatcherSecret, "utf8");
  const received = Buffer.from(receivedSecret, "utf8");

  if (expected.length !== received.length) {
    // Ainda gasta um `timingSafeEqual` contra um buffer do mesmo tamanho do
    // recebido para não vazar timing entre "tamanho errado" e "tamanho
    // certo, conteúdo errado" — comparação descartada, só o "custo" importa.
    timingSafeEqual(received, received);
    return false;
  }

  return timingSafeEqual(expected, received);
}

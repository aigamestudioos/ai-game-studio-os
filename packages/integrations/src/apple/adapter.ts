import { checkAppleHealth, fetchAppleApp, fetchAppleApps } from "./client";
import type { AppleCredentials, ApplePublishingAdapter } from "./types";

// Factory do adapter (AGSOS-SPEC-008 §3) — único ponto de entrada que
// código fora deste pacote deveria importar. Nunca instanciar
// AppleCredentials/chamar `client.ts` diretamente de `apps/web`.
export function createApplePublishingAdapter(credentials: AppleCredentials): ApplePublishingAdapter {
  return {
    // Sem "sessão" para abrir de verdade (API stateless, JWT por chamada) —
    // connect() delega para health(), é o mais próximo de um "abrir conexão"
    // que faz sentido aqui.
    async connect() {
      return checkAppleHealth(credentials);
    },
    async disconnect() {
      // Nada para fechar do lado da Apple. Limpar o segredo é
      // responsabilidade do caller (repository), não do adapter.
    },
    async health() {
      return checkAppleHealth(credentials);
    },
    async listApps() {
      return fetchAppleApps(credentials);
    },
    async getApp(appId: string) {
      return fetchAppleApp(appId, credentials);
    },
  };
}

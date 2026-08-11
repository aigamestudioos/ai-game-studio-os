import {
  checkAppleHealth,
  commitAppleBuildUploadFile,
  createAppleBuildUpload,
  deleteAppleBuildUpload,
  fetchAppleApp,
  fetchAppleApps,
  getAppleBuildUpload,
  reserveAppleBuildUploadFile,
  uploadAppleBuildUploadFileOperations,
} from "./client";
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
    async createBuildUpload(params) {
      return createAppleBuildUpload(credentials, params);
    },
    async reserveBuildUploadFile(params) {
      return reserveAppleBuildUploadFile(credentials, params);
    },
    async uploadBuildUploadFileOperations(operations, fileBuffer) {
      return uploadAppleBuildUploadFileOperations(operations, fileBuffer);
    },
    async commitBuildUploadFile(buildUploadFileId) {
      return commitAppleBuildUploadFile(credentials, buildUploadFileId);
    },
    async getBuildUpload(buildUploadId) {
      return getAppleBuildUpload(credentials, buildUploadId);
    },
    async deleteBuildUpload(buildUploadId) {
      return deleteAppleBuildUpload(credentials, buildUploadId);
    },
  };
}

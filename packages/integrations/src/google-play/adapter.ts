import {
  checkGoogleHealth,
  createGoogleEdit,
  createGoogleResumableSession,
  deleteGoogleEdit,
  fetchGoogleApps,
  queryGoogleResumableProgress,
  uploadGoogleBundle,
  uploadGoogleResumableChunk,
} from "./client";
import type { GoogleCredentials, GooglePlayPublishingAdapter } from "./types";

export function createGooglePlayPublishingAdapter(credentials: GoogleCredentials): GooglePlayPublishingAdapter {
  return {
    async connect() {
      return checkGoogleHealth(credentials);
    },
    async disconnect() {
      // Nada para fechar do lado do Google. Limpar o segredo é
      // responsabilidade do caller (repository), não do adapter.
    },
    async health() {
      return checkGoogleHealth(credentials);
    },
    async listApps() {
      return fetchGoogleApps(credentials);
    },
    async createEdit() {
      return createGoogleEdit(credentials);
    },
    async uploadBundle(editId, bundle) {
      return uploadGoogleBundle(credentials, editId, bundle);
    },
    async deleteEdit(editId) {
      return deleteGoogleEdit(credentials, editId);
    },
    async createResumableSession(editId, totalBytes, mimeType) {
      return createGoogleResumableSession(credentials, editId, totalBytes, mimeType);
    },
    async uploadResumableChunk(sessionUri, chunk, startByte, totalBytes) {
      return uploadGoogleResumableChunk(sessionUri, chunk, startByte, totalBytes);
    },
    async queryResumableProgress(sessionUri, totalBytes) {
      return queryGoogleResumableProgress(sessionUri, totalBytes);
    },
  };
}

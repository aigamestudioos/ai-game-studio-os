import { checkGoogleHealth, createGoogleEdit, deleteGoogleEdit, fetchGoogleApps, uploadGoogleBundle } from "./client";
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
  };
}

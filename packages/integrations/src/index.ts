// AGSOS-SPEC-008 §2 — um subdiretório por integração; Apple (Sprint 2.9) e
// Google Play (Sprint 2.10) compartilham o framework em `./core`. `apps/web`
// nunca importa `./apple/client`/`./google-play/client` etc. diretamente —
// só o que este barrel exporta.
export { createApplePublishingAdapter } from "./apple/adapter";
export type { AppleApp, AppleCredentials, ApplePublishingAdapter } from "./apple/types";

export { createGooglePlayPublishingAdapter } from "./google-play/adapter";
export type { GoogleApp, GoogleBundle, GoogleCredentials, GooglePlayPublishingAdapter } from "./google-play/types";

export type { HealthResult, IntegrationAdapter, ItemResult, ListResult } from "./core/types";

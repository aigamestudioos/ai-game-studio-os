// AGSOS-SPEC-008 §2 — um subdiretório por integração; Apple é a primeira
// implementada de verdade (Sprint 2.9). `apps/web` nunca importa
// `./apple/client`/`./apple/jwt` diretamente — só o que este barrel exporta.
export { createApplePublishingAdapter } from "./apple/adapter";
export type { AppleApp, AppleCredentials, ApplePublishingAdapter } from "./apple/types";

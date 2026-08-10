import type { ReactNode } from "react";

// Sprint 2.11b — `maxDuration=120` escopado só a esta rota (Version), não
// ao app inteiro: `sendArtifactToGooglePlay`/`retryProviderUpload`
// (provider-upload-actions.ts) baixam o AAB do Storage e reenviam à
// Google no mesmo request. Valor alinhado ao timeout de "Upload" já
// congelado em AGSOS-SPEC-008 §10 (ver DECISIONS.md) — não inventado por
// este sprint, só aplicado pela primeira vez a um caminho de código real.
export const maxDuration = 120;

export default function GameVersionLayout({ children }: { children: ReactNode }) {
  return children;
}

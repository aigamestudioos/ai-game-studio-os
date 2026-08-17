import { describe, expect, it } from "vitest";
import { classifyGoogleCommitError } from "./submission-error-classification";

// Sprint 2.16a (GATE 17/22) — mapeamento de erro estável do commit de
// Edit/track (nunca exercitado por chamada real neste sprint — GATE 25 —
// mas precisa estar correto para quando Production Validation ligar
// `AGSOS_ALLOW_STORE_MUTATION`).
describe("classifyGoogleCommitError", () => {
  it("UNAUTHORIZED -> AUTH", () => {
    expect(classifyGoogleCommitError("UNAUTHORIZED")).toBe("AUTH");
  });

  it("FORBIDDEN/NOT_FOUND/PROVIDER_REJECTED -> NON_RETRYABLE", () => {
    expect(classifyGoogleCommitError("FORBIDDEN")).toBe("NON_RETRYABLE");
    expect(classifyGoogleCommitError("NOT_FOUND")).toBe("NON_RETRYABLE");
    expect(classifyGoogleCommitError("PROVIDER_REJECTED")).toBe("NON_RETRYABLE");
  });

  it("RATE_LIMITED -> RATE_LIMIT", () => {
    expect(classifyGoogleCommitError("RATE_LIMITED")).toBe("RATE_LIMIT");
  });

  it("SERVER_ERROR -> RETRYABLE", () => {
    expect(classifyGoogleCommitError("SERVER_ERROR")).toBe("RETRYABLE");
  });

  it("código desconhecido/ausente -> INTERNAL (nunca finge saber classificar)", () => {
    expect(classifyGoogleCommitError(undefined)).toBe("INTERNAL");
    expect(classifyGoogleCommitError("SOMETHING_NEW")).toBe("INTERNAL");
  });
});

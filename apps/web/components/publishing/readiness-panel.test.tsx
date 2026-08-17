import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReadinessCheck, ReleaseReadiness } from "@agsos/database";
import { ReadinessPanel } from "./readiness-panel";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

function makeCheck(overrides: Partial<ReadinessCheck> = {}): ReadinessCheck {
  return {
    code: "ARTIFACT_MISSING",
    status: "PASS",
    category: "ARTIFACT",
    severity: "BLOCKER",
    blocking: false,
    implementationStatus: "IMPLEMENTED",
    message: "Artefato encontrado.",
    entityType: "BUILD_ARTIFACT",
    entityId: "artifact-1",
    submissionId: "submission-1",
    platform: "Google Play",
    ...overrides,
  };
}

function makeReadiness(overrides: Partial<ReleaseReadiness> = {}): ReleaseReadiness {
  return {
    releaseId: "release-1",
    studioId: "studio-1",
    status: "READY",
    blockerCount: 0,
    evaluatedAt: new Date().toISOString(),
    checks: [makeCheck()],
    ...overrides,
  };
}

describe("ReadinessPanel", () => {
  it("mostra spinner de loading quando ainda não há dado", () => {
    render(<ReadinessPanel readiness={undefined} loading />);
    expect(screen.getByRole("status", { name: "Carregando" })).toBeInTheDocument();
  });

  it("mostra mensagem de erro quando a Server Action falha", () => {
    render(<ReadinessPanel readiness={null} error="Não foi possível calcular o readiness deste Release." />);
    expect(screen.getByText("Não foi possível calcular o readiness deste Release.")).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há readiness (Release sem Submission)", () => {
    render(<ReadinessPanel readiness={null} />);
    expect(screen.getByText(/nenhuma plataforma-alvo/i)).toBeInTheDocument();
  });

  it("mostra READY com badge de sucesso quando status é READY", () => {
    render(<ReadinessPanel readiness={makeReadiness({ status: "READY" })} />);
    expect(screen.getByText("Pronto para submissão")).toBeInTheDocument();
  });

  it("mostra NOT_READY com blockers acionáveis quando status é NOT_READY", () => {
    const readiness = makeReadiness({
      status: "NOT_READY",
      blockerCount: 1,
      checks: [
        makeCheck({
          code: "STORE_CONNECTION_MISSING",
          status: "FAIL",
          blocking: true,
          message: "O Studio não tem conexão configurada com Google Play.",
        }),
      ],
    });
    render(<ReadinessPanel readiness={readiness} />);
    expect(screen.getByText("Não pronto")).toBeInTheDocument();
    expect(screen.getByText("O Studio não tem conexão configurada com Google Play.")).toBeInTheDocument();
    expect(screen.getByText("Bloqueia submissão")).toBeInTheDocument();
    const fixLink = screen.getByRole("link", { name: "Corrigir" });
    expect(fixLink).toHaveAttribute("href", "/settings/store-connections");
  });

  it("Sprint 2.15 — 'Corrigir' de METADATA_LISTING_MISSING aponta para o Game→Store Listing (deep link por entityId)", () => {
    const readiness = makeReadiness({
      status: "NOT_READY",
      blockerCount: 1,
      checks: [
        makeCheck({
          code: "METADATA_LISTING_MISSING",
          status: "FAIL",
          blocking: true,
          entityType: "GAME",
          entityId: "game-42",
          message: "Nenhuma ficha de loja cadastrada para este Game.",
        }),
      ],
    });
    render(<ReadinessPanel readiness={readiness} />);
    const fixLink = screen.getByRole("link", { name: "Corrigir" });
    expect(fixLink).toHaveAttribute("href", "/games/game-42#store-listing");
  });

  it("distingue visualmente WARNING/NOT_APPLICABLE de um blocker real", () => {
    const readiness = makeReadiness({
      status: "NOT_READY",
      blockerCount: 1,
      checks: [
        makeCheck({
          code: "METADATA_RELEASE_NOTES_MISSING",
          status: "WARN",
          blocking: false,
          message: "A Release não tem release notes.",
        }),
        makeCheck({
          code: "METADATA_SCREENSHOTS_MISSING",
          status: "NOT_APPLICABLE",
          blocking: false,
          message: "Screenshots de loja ainda não são modelados no AGSOS.",
        }),
        makeCheck({
          code: "ARTIFACT_MISSING",
          status: "FAIL",
          blocking: true,
          message: "Nenhum artefato enviado para este Build.",
        }),
      ],
    });
    render(<ReadinessPanel readiness={readiness} />);
    // Só um "Bloqueia submissão" deve aparecer — WARN e NOT_APPLICABLE não são blockers.
    expect(screen.getAllByText("Bloqueia submissão")).toHaveLength(1);
    expect(screen.getByText("A Release não tem release notes.")).toBeInTheDocument();
    expect(screen.getByText("Screenshots de loja ainda não são modelados no AGSOS.")).toBeInTheDocument();
  });
});

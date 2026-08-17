import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Sprint 2.12b — GATE 9: Submission Gate. Testa que "Criar Submissão"
// fica desabilitado quando o Release selecionado está NOT_READY e
// habilitado quando está READY, e que criar a Submission não dispara
// nada além do fluxo já existente (createSubmission) — nenhum envio a
// review/loja é acionado por este teste nem pelo componente.

const mockSession = { user: { id: "user-1", email: "owner@example.com" } };

vi.mock("../../hooks/use-auth", () => ({
  useAuth: () => ({ session: mockSession, ensureStudio: vi.fn() }),
}));

vi.mock("../../hooks/use-current-studio", () => ({
  useCurrentStudio: () => ({ studio: { id: "studio-1" } }),
}));

const createSubmission = vi.fn().mockResolvedValue({ id: "submission-new" });
let releases: Array<{
  releaseId: string;
  gameVersionId: string;
  gameName: string;
  versionNumber: string;
  releaseChannel: string;
  builds: { buildId: string; platformId: string; platformName: string }[];
}> = [];

vi.mock("../../hooks/use-publishable-releases", () => ({
  usePublishableReleases: () => ({ releases, error: null, refresh: vi.fn(), createSubmission }),
}));

vi.mock("../../hooks/use-submissions", () => ({
  useSubmissions: () => ({ submissions: [], error: null, refresh: vi.fn() }),
}));

// Sprint 2.14 — GATE 1: "FIRST_SUBMISSION" reproduz o veredito real de
// `get_release_readiness` para um Release sem nenhuma Submission ativa —
// o único check é `SUBMISSION_TARGETS_MISSING` (blocking=true), porque os
// demais checks (artifact, store connection...) só são avaliados por
// Submission já existente. O Submission Gate não deve tratar esse caso
// como bloqueado (ver lib/readiness-status.ts).
let readinessStatus: "READY" | "NOT_READY" | "FIRST_SUBMISSION" = "NOT_READY";
vi.mock("../../hooks/use-release-readiness", () => ({
  useReleaseReadiness: () => ({
    readiness:
      readinessStatus === "READY"
        ? { releaseId: "release-1", studioId: "studio-1", status: "READY", blockerCount: 0, evaluatedAt: "", checks: [] }
        : readinessStatus === "FIRST_SUBMISSION"
          ? {
              releaseId: "release-1",
              studioId: "studio-1",
              status: "NOT_READY",
              blockerCount: 1,
              evaluatedAt: "",
              checks: [
                {
                  code: "SUBMISSION_TARGETS_MISSING",
                  status: "FAIL",
                  category: "SUBMISSION",
                  severity: "BLOCKER",
                  blocking: true,
                  implementationStatus: "IMPLEMENTED",
                  message: "A Release ainda não tem nenhuma Submission para esta plataforma.",
                  entityType: "RELEASE",
                  entityId: "release-1",
                  submissionId: null,
                  platform: null,
                },
              ],
            }
          : {
              releaseId: "release-1",
              studioId: "studio-1",
              status: "NOT_READY",
              blockerCount: 1,
              evaluatedAt: "",
              checks: [
                {
                  code: "STORE_CONNECTION_MISSING",
                  status: "FAIL",
                  category: "STORE_CONNECTION",
                  severity: "BLOCKER",
                  blocking: true,
                  implementationStatus: "IMPLEMENTED",
                  message: "O Studio não tem conexão configurada com Google Play.",
                  entityType: "PLATFORM",
                  entityId: "platform-1",
                  submissionId: null,
                  platform: "Google Play",
                },
              ],
            },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

// AppShell puxa layout (sidebar/topbar) e roteamento — foge do escopo deste
// teste (Submission Gate), então é substituído por um wrapper mínimo.
vi.mock("../../components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import PublishingPage from "./page";

describe("Publishing — Submission Gate", () => {
  beforeEach(() => {
    createSubmission.mockClear();
    releases = [
      {
        releaseId: "release-1",
        gameVersionId: "version-1",
        gameName: "Meu Jogo",
        versionNumber: "1.0.0",
        releaseChannel: "PRODUCTION",
        builds: [{ buildId: "build-1", platformId: "platform-1", platformName: "Google Play" }],
      },
    ];
  });

  it("desabilita 'Criar Submissão' quando o Release está NOT_READY", async () => {
    readinessStatus = "NOT_READY";
    const user = userEvent.setup();
    render(<PublishingPage />);

    await user.click(screen.getByRole("button", { name: /new submission/i }));
    await user.click(screen.getByRole("button", { name: /Meu Jogo/i }));
    await user.click(screen.getByRole("button", { name: "Google Play" }));

    expect(screen.getByText("O Studio não tem conexão configurada com Google Play.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar Submissão" })).toBeDisabled();
    expect(createSubmission).not.toHaveBeenCalled();
  });

  it("habilita 'Criar Submissão' para a 1ª Submission mesmo com SUBMISSION_TARGETS_MISSING (GATE 1, Sprint 2.14)", async () => {
    readinessStatus = "FIRST_SUBMISSION";
    const user = userEvent.setup();
    render(<PublishingPage />);

    await user.click(screen.getByRole("button", { name: /new submission/i }));
    await user.click(screen.getByRole("button", { name: /Meu Jogo/i }));
    await user.click(screen.getByRole("button", { name: "Google Play" }));

    const submitButton = screen.getByRole("button", { name: "Criar Submissão" });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(createSubmission).toHaveBeenCalledTimes(1);
    expect(createSubmission).toHaveBeenCalledWith({
      releaseId: "release-1",
      buildId: "build-1",
      platformId: "platform-1",
    });
  });

  it("habilita 'Criar Submissão' quando o Release está READY e cria só a Submission", async () => {
    readinessStatus = "READY";
    const user = userEvent.setup();
    render(<PublishingPage />);

    await user.click(screen.getByRole("button", { name: /new submission/i }));
    await user.click(screen.getByRole("button", { name: /Meu Jogo/i }));
    await user.click(screen.getByRole("button", { name: "Google Play" }));

    const submitButton = screen.getByRole("button", { name: "Criar Submissão" });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(createSubmission).toHaveBeenCalledTimes(1);
    expect(createSubmission).toHaveBeenCalledWith({
      releaseId: "release-1",
      buildId: "build-1",
      platformId: "platform-1",
    });
  });
});

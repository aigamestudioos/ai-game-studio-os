import { describe, expect, it } from "vitest";
import type { SubmissionStatus } from "@agsos/database";
import { allowedSubmissionAction, isSubmissionInFlight, isSubmissionTerminalSuccess } from "./submission-lifecycle";

// Sprint 2.16a (GATE 22) — cobre a state machine espelhada no client.
// Nenhum destes casos chama rede/DB: só o helper puro.
describe("allowedSubmissionAction", () => {
  it("DRAFT permite PREPARE", () => {
    expect(allowedSubmissionAction("DRAFT")).toBe("PREPARE");
  });

  it("READY_TO_SUBMIT permite SUBMIT", () => {
    expect(allowedSubmissionAction("READY_TO_SUBMIT")).toBe("SUBMIT");
  });

  it("FAILED permite RETRY", () => {
    expect(allowedSubmissionAction("FAILED")).toBe("RETRY");
  });

  const noAction: SubmissionStatus[] = ["SUBMITTING", "SUBMITTED", "WAITING", "IN_REVIEW", "APPROVED", "REJECTED", "PUBLISHED", "CANCELLED"];
  it.each(noAction)("%s não permite nenhuma ação de transição pela UI", (status) => {
    expect(allowedSubmissionAction(status)).toBeNull();
  });
});

describe("isSubmissionInFlight", () => {
  it("só SUBMITTING está em voo", () => {
    expect(isSubmissionInFlight("SUBMITTING")).toBe(true);
    expect(isSubmissionInFlight("SUBMITTED")).toBe(false);
    expect(isSubmissionInFlight("DRAFT")).toBe(false);
  });
});

describe("isSubmissionTerminalSuccess", () => {
  it("SUBMITTED é sucesso terminal do lifecycle local — nunca confundido com Publicado", () => {
    expect(isSubmissionTerminalSuccess("SUBMITTED")).toBe(true);
  });

  it("APPROVED/PUBLISHED nunca contam como sucesso aqui — são DEFINED_BUT_UNREACHABLE neste sprint", () => {
    expect(isSubmissionTerminalSuccess("APPROVED")).toBe(false);
    expect(isSubmissionTerminalSuccess("PUBLISHED")).toBe(false);
  });
});

"use client";

import { useState } from "react";
import type { SubmissionStatus } from "@agsos/database";
import { transitionSubmissionAction } from "../../app/publishing/submission-actions";
import { allowedSubmissionAction, isSubmissionInFlight } from "../../lib/submission-lifecycle";
import { Button } from "../ui/button";

// Sprint 2.16a (GATE 15) — botões de ação da tela de detalhe de
// Submission. Mostra só a ação que a state machine permite no estado
// atual — nunca "Publicado" sem prova real de loja (GATE 15/27): o rótulo
// máximo que este componente produz é "Enviado" (SUBMITTED), nunca
// "Publicado".
type Props = {
  submissionId: string;
  status: SubmissionStatus;
  onChanged: () => void;
};

export function SubmissionLifecycleActions({ submissionId, status, onChanged }: Props) {
  const [pending, setPending] = useState<"PREPARE" | "SUBMIT" | "RETRY" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "PREPARE" | "SUBMIT" | "RETRY") {
    setPending(action);
    setError(null);
    try {
      const { error: actionError } = await transitionSubmissionAction(submissionId, action);
      if (actionError) {
        setError(actionError);
        return;
      }
      // GATE 12 — a Server Action já retornou rápido (a execução real, se
      // houver, é assíncrona via job); refetch imediato aqui pega o novo
      // estado local (READY_TO_SUBMIT/SUBMITTING) — o polling de
      // `useSubmission` cobre a conclusão do job em segundo plano.
      onChanged();
    } finally {
      setPending(null);
    }
  }

  const action = allowedSubmissionAction(status);
  const labels: Record<"PREPARE" | "SUBMIT" | "RETRY", { idle: string; pending: string }> = {
    PREPARE: { idle: "Preparar envio", pending: "Preparando…" },
    SUBMIT: { idle: "Enviar", pending: "Enviando…" },
    RETRY: { idle: "Retry", pending: "Reenviando…" },
  };

  return (
    <div className="space-y-sm">
      <div className="flex gap-sm">
        {action ? (
          <Button size="sm" variant={action === "RETRY" ? "secondary" : "default"} disabled={pending !== null} onClick={() => run(action)}>
            {pending === action ? labels[action].pending : labels[action].idle}
          </Button>
        ) : null}

        {isSubmissionInFlight(status) ? <span className="text-sm text-muted-foreground">Envio em andamento…</span> : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

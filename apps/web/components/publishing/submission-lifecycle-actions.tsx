"use client";

import { useEffect, useState } from "react";
import type { SubmissionStatus } from "@agsos/database";
import { transitionSubmissionAction } from "../../app/publishing/submission-actions";
import { allowedSubmissionAction, isSubmissionInFlight } from "../../lib/submission-lifecycle";
import { getBrowserClient } from "../../lib/supabase-client";
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
  // Sprint 2.16d (GATE D) — todas as ações desta state machine exigem
  // `publishing.submit` no servidor (`transition_submission` checa isso
  // antes de qualquer outra coisa, para PREPARE/SUBMIT/RETRY igualmente).
  // Antes deste fix o botão aparecia SEMPRE que a state machine client-side
  // permitia (independente de permissão) — o servidor rejeitava a chamada,
  // mas a UI sugeria incorretamente que a ação estava disponível para
  // qualquer papel (ex.: Member com só `publishing.read`). `default: false`
  // — nunca mostra a ação até confirmar a permissão via RPC (o mesmo check
  // que o servidor faz), nunca assume permitido enquanto carrega.
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getBrowserClient().rpc("current_user_has_permission", { p_key: "publishing.submit" });
        if (!cancelled) setCanSubmit(data === true);
      } catch {
        if (!cancelled) setCanSubmit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        {action && canSubmit ? (
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSubmissionsRepository, type SubmissionWithDetails, type StoreReviewsRow } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Submission + store_reviews para a tela de detalhes (Sprint 2.3).
// `submission === undefined` → carregando; `null` → carregado, não
// encontrada.
//
// Sprint 2.16a — GATE 12 pede "UI → transition/enqueue → retorna rápido →
// job persistido → worker → checkpoint → transition da Submission → UI
// polling/refetch" — nunca uma chamada web longa esperando o provider.
// `reload` é exposto para os botões de ação (PREPARE/SUBMIT/RETRY, ver
// `submission-lifecycle-actions.tsx`) chamarem depois de cada transição, e
// o polling automático abaixo cobre o caso SUBMITTING (job em andamento
// noutro processo/worker, sem nenhuma ação do usuário) — para de fazer
// polling assim que a Submission sai de SUBMITTING.
const SUBMITTING_POLL_INTERVAL_MS = 3000;

export function useSubmission(id: string) {
  const [submission, setSubmission] = useState<SubmissionWithDetails | null | undefined>(undefined);
  const [reviews, setReviews] = useState<StoreReviewsRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reloadRef = useRef<() => Promise<void>>(async () => {});

  const load = useCallback(async () => {
    try {
      const client = getBrowserClient();
      const repo = createSubmissionsRepository(client);

      const row = await repo.getWithDetails(id);
      setSubmission(row);

      if (row) {
        const reviewRows = await repo.listReviews(row.id);
        setReviews(reviewRows);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar a submissão.");
    }
  }, [id]);

  useEffect(() => {
    reloadRef.current = load;
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (submission?.status !== "SUBMITTING") return;
    const interval = setInterval(() => {
      reloadRef.current();
    }, SUBMITTING_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [submission?.status]);

  return { submission, reviews, error, reload: load };
}

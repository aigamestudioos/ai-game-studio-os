"use client";

import { useEffect, useState } from "react";
import { createSubmissionsRepository, type SubmissionWithDetails, type StoreReviewsRow } from "@agsos/database";
import { getBrowserClient } from "../lib/supabase-client";

// Submission + store_reviews para a tela de detalhes (Sprint 2.3).
// `submission === undefined` → carregando; `null` → carregado, não
// encontrada.
export function useSubmission(id: string) {
  const [submission, setSubmission] = useState<SubmissionWithDetails | null | undefined>(undefined);
  const [reviews, setReviews] = useState<StoreReviewsRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = getBrowserClient();
        const repo = createSubmissionsRepository(client);

        const row = await repo.getWithDetails(id);
        if (cancelled) return;
        setSubmission(row);

        if (row) {
          const reviewRows = await repo.listReviews(row.id);
          if (!cancelled) setReviews(reviewRows);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Falha ao carregar a submissão.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { submission, reviews, error };
}

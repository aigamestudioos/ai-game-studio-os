import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, IntegrationJobsRow, JobErrorClass, JobStatus } from "../generated/database.types";

// Repository de IntegrationJob (Sprint 2.11d-1/2.11d-2 — Provider Transfer
// Engine). Mecanismo operacional de execução (distinto de `ProviderUpload`,
// que é o fato de domínio) — ver `ADR-006-provider-transfer-worker.md`.
// Todo método aqui chama uma RPC `service_role`-only definida em
// `supabase/migrations/20260813000003_job_claim_and_enqueue.sql` (claim/
// requeue) ou `20260814000001_dispatcher_job_lifecycle_rpcs.sql`
// (running/lease/checkpoint/complete) — nunca lê/escreve a tabela
// diretamente, mesmo padrão de `provider-uploads-repository.ts`.
export function createIntegrationJobsRepository(client: SupabaseClient<Database>) {
  return {
    async claim(params: { workerId: string; limit?: number; leaseSeconds?: number }): Promise<IntegrationJobsRow[]> {
      const { data, error } = await client.rpc("claim_integration_jobs", {
        p_worker_id: params.workerId,
        p_limit: params.limit,
        p_lease_seconds: params.leaseSeconds,
      });
      if (error) throw error;
      return data ?? [];
    },

    async requeueStale(): Promise<number> {
      const { data, error } = await client.rpc("requeue_stale_jobs");
      if (error) throw error;
      return data ?? 0;
    },

    async startRunning(params: { jobId: string; workerId: string }): Promise<IntegrationJobsRow> {
      const { data, error } = await client.rpc("start_integration_job_running", {
        p_job_id: params.jobId,
        p_worker_id: params.workerId,
      });
      if (error) throw error;
      return data as IntegrationJobsRow;
    },

    async renewLease(params: { jobId: string; workerId: string; leaseSeconds?: number }): Promise<IntegrationJobsRow> {
      const { data, error } = await client.rpc("renew_integration_job_lease", {
        p_job_id: params.jobId,
        p_worker_id: params.workerId,
        p_lease_seconds: params.leaseSeconds,
      });
      if (error) throw error;
      return data as IntegrationJobsRow;
    },

    async checkpointAndRelease(params: {
      jobId: string;
      workerId: string;
      checkpoint: Record<string, unknown>;
    }): Promise<IntegrationJobsRow> {
      const { data, error } = await client.rpc("checkpoint_and_release_integration_job", {
        p_job_id: params.jobId,
        p_worker_id: params.workerId,
        p_checkpoint: params.checkpoint,
      });
      if (error) throw error;
      return data as IntegrationJobsRow;
    },

    async complete(params: {
      jobId: string;
      workerId: string;
      status: JobStatus;
      checkpoint?: Record<string, unknown> | null;
      errorCode?: string | null;
      errorClass?: JobErrorClass | null;
      nextAttemptAt?: string | null;
    }): Promise<IntegrationJobsRow> {
      const { data, error } = await client.rpc("complete_integration_job", {
        p_job_id: params.jobId,
        p_worker_id: params.workerId,
        p_status: params.status,
        p_checkpoint: params.checkpoint ?? null,
        p_error_code: params.errorCode ?? null,
        p_error_class: params.errorClass ?? null,
        p_next_attempt_at: params.nextAttemptAt ?? null,
      });
      if (error) throw error;
      return data as IntegrationJobsRow;
    },
  };
}

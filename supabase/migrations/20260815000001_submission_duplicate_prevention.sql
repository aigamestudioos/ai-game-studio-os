-- Sprint 2.13 GATE 1 — Duplicate Submission: fecha o ACHADO registrado em
-- DECISIONS.md (Sprint 2.12c, "Duplicate Submission: nenhuma prevenção
-- existe hoje"). `submissions` não tinha nenhuma constraint de unicidade —
-- criar uma 2ª Submission idêntica (mesma Release + mesma Platform) era
-- aceito silenciosamente.
--
-- Granularidade escolhida: `(release_id, platform_id)`, não `(release_id)`
-- sozinho — um Release pode legitimamente ter Submissions distintas em
-- paralelo para plataformas diferentes (Google + Apple), confirmado pelo
-- golden path do 2.12c (`scripts/test-readiness-golden-path.mjs`, cenário
-- "Release com Google + Apple").
--
-- Condicional a status: a unicidade só vale para Submissions ATIVAS (não em
-- um estado terminal). `submission_status` (20260716000001_enums.sql) tem
-- 'DRAFT','WAITING','SUBMITTED','IN_REVIEW','APPROVED','REJECTED',
-- 'PUBLISHED','CANCELLED'. Interpretação escolhida (a mais conservadora e
-- defensável, documentada em DECISIONS.md): uma nova Submission para o
-- mesmo Release+Platform só é permitida quando a anterior já chegou a um
-- estado terminal — sucesso (PUBLISHED) ou falha (REJECTED, CANCELLED).
-- 'APPROVED' NÃO é tratado como terminal aqui: é um estado intermediário
-- a caminho de PUBLISHED, não o fim do ciclo de review.
--
-- Defesa em profundidade: um índice único parcial no Postgres é a fonte da
-- verdade (determinístico sob concorrência real, diferente de qualquer
-- checagem em JS antes do insert, que teria race condition). Não foi
-- adicionada uma checagem redundante em `submissions-repository.ts`/
-- `use-publishable-releases.ts` porque a criação de Submission já é um
-- único `insert` direto (sem transação multi-step) — o índice sozinho já
-- garante atomicidade; uma pré-checagem em JS só serviria para UX (mensagem
-- mais amigável antes do erro do banco), fora do escopo deste GATE.
create unique index if not exists idx_submissions_release_platform_active
  on submissions (release_id, platform_id)
  where archived_at is null
    and status not in ('PUBLISHED', 'REJECTED', 'CANCELLED');

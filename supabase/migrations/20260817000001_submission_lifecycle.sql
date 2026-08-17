-- Sprint 2.16a — Submission Lifecycle Foundation: state machine, RPC de
-- transição server-side, permissão `publishing.submit`, readiness
-- defense-in-depth, e job assíncrono de execução (reaproveitando
-- `integration_jobs`/dispatcher do Sprint 2.11d — NÃO uma fila paralela).
--
-- GATE 0 (auditoria, ver relatório final) confirmou: `submission_status`
-- (20260716000001_enums.sql) tem DRAFT/WAITING/SUBMITTED/IN_REVIEW/
-- APPROVED/REJECTED/PUBLISHED/CANCELLED. Nenhuma dessas transições era
-- gravada em lugar nenhum — Submission nasce DRAFT (insert direto, ver
-- `use-publishable-releases.ts`) e nunca muda de status via nenhum RPC.
-- `WAITING` nunca é escrito por nenhum código real — DEFINED_BUT_UNREACHABLE,
-- mantido no enum (não removido: `ALTER TYPE ... DROP VALUE` não existe em
-- Postgres, e não há motivo para simular remoção). `APPROVED`/`PUBLISHED`
-- também ficam DEFINED_BUT_UNREACHABLE neste sprint — não fabricamos
-- transições para eles: o sistema não tem hoje nenhum mecanismo real para
-- provar aprovação/publicação de loja (isso é Store Review ingestion,
-- fora de escopo, GATE 19 do sprint).
--
-- Três estados novos, mínimos e necessários para o lifecycle real pedido:
--   READY_TO_SUBMIT — Release recalculada como READY, Submission preparada.
--   SUBMITTING      — envio em andamento (job ativo em integration_jobs).
--   FAILED          — última tentativa de envio terminou em erro.
-- `ALTER TYPE ... ADD VALUE` roda como statement isolado (não pode ser
-- usado na mesma transação que já referencia o tipo) — cada arquivo de
-- migration do Supabase CLI já roda em sua própria transação, então isso é
-- seguro como os primeiros statements deste arquivo (mesmo padrão de
-- 20260814135125_integration_jobs.sql).
alter type submission_status add value if not exists 'READY_TO_SUBMIT';
alter type submission_status add value if not exists 'SUBMITTING';
alter type submission_status add value if not exists 'FAILED';

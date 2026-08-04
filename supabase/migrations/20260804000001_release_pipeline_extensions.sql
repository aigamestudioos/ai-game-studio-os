-- Sprint 2.4 — Extensão de schema para a cadeia Game Version → Build →
-- Release (base do Release Pipeline). Só schema/repositories, sem UI —
-- decisão de dividir o sprint pedido pelo usuário em incrementos menores
-- (ver IMPLEMENTATION_LOG.md).
--
-- Aditivo apenas: nenhuma coluna/enum existente é removida ou renomeada
-- (AGSOS-SPEC-003 §3, "Migrações forward-only"; §13 ENUMs oficiais
-- permanecem intactos). `build_type` e `release_channel` são ENUMs novos —
-- não estavam na lista oficial de AGSOS-SPEC-003 §13 porque os atributos que
-- eles tipam também não existiam; a extensão do documento normativo fica
-- registrada como pendência em IMPLEMENTATION_LOG.md, não neste commit.
--
-- Não foi adicionado `platform_id`/target_store em `releases`: o modelo já
-- existente (`submissions.release_id` N:1 `releases`, `submissions.platform_id`)
-- permite que um Release gere Submissions para lojas diferentes — duplicar a
-- plataforma no Release contradiria essa relação N:1 já modelada.

create type build_type as enum ('DEBUG', 'RELEASE', 'INTERNAL', 'PRODUCTION');
create type release_channel as enum ('INTERNAL', 'ALPHA', 'BETA', 'PRODUCTION');

alter table game_versions
  add column changelog text null,
  add column branch text null,
  add column commit_hash text null;

alter table builds
  add column build_number integer null,
  add column build_type build_type not null default 'INTERNAL',
  add column artifact_size bigint null,
  add column checksum text null,
  add column generated_at timestamptz null;

alter table releases
  add column release_channel release_channel not null default 'INTERNAL',
  add column scheduled_at timestamptz null,
  add column published_at timestamptz null,
  add column release_notes text null,
  add column rollout_percentage smallint null
    constraint chk_releases_rollout_percentage check (rollout_percentage between 0 and 100);

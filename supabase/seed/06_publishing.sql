-- Espelha SEED_SUBMISSIONS de apps/web/lib/publishing-store.ts. O "history"
-- do mock vira store_reviews aqui — no schema real, o histórico completo de
-- status também é reconstruível via studio_events (ver DATA_MODEL.md §7),
-- mas store_reviews guarda especificamente as decisões de revisão da loja.

insert into submissions (id, studio_id, release_id, platform_id, build_id, status, created_actor_type, updated_actor_type) values
  ('f0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'IN_REVIEW', 'USER', 'USER'),
  ('f0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', 'REJECTED', 'USER', 'USER'),
  ('f0000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000005', 'PUBLISHED', 'USER', 'USER');

insert into store_reviews (studio_id, submission_id, decision, reviewed_at, created_actor_type, updated_actor_type) values
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'IN_REVIEW', now() - interval '2 hours', 'USER', 'USER'),

  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'IN_REVIEW', now() - interval '3 days', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'REJECTED', now() - interval '1 day', 'USER', 'USER'),

  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'IN_REVIEW', now() - interval '8 days', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'APPROVED', now() - interval '6 days', 'USER', 'USER'),
  ('70000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'PUBLISHED', now() - interval '5 days', 'USER', 'USER');

-- Seed de desenvolvimento — espelha os dados mock já usados em
-- apps/web/lib/{projects,games,knowledge,publishing}-store.ts, para que a
-- demonstração fique consistente quando o Sprint 1.8 conectar de verdade.
--
-- auth.users inserido diretamente (padrão de seed local do Supabase CLI;
-- em staging/produção o usuário é criado via signup real, nunca por seed).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '50000000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated',
  'founder@aigamestudio.os',
  crypt('demo-password-local-only', gen_salt('bf')),
  now(), now(), now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}'
);

-- environments: precisa existir antes de studios.active_environment_id.
insert into environments (id, studio_id, type, name, created_actor_type, updated_actor_type) values
  ('60000000-0000-0000-0000-000000000001', null, 'LOCAL', 'Local Development', 'SYSTEM', 'SYSTEM');

insert into studios (
  id, name, timezone, currency, locale, active_environment_id,
  owner_user_id, created_actor_type, updated_actor_type
) values (
  '70000000-0000-0000-0000-000000000001',
  'AI Game Studio OS',
  'America/Sao_Paulo', 'BRL', 'pt-BR',
  '60000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  'SYSTEM', 'SYSTEM'
);

update environments set studio_id = '70000000-0000-0000-0000-000000000001'
  where id = '60000000-0000-0000-0000-000000000001';

insert into users (id, studio_id, email, name, created_actor_type, updated_actor_type) values (
  '50000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  'founder@aigamestudio.os',
  'Fundador',
  'USER', 'USER'
);

insert into roles (id, studio_id, name, description, created_actor_type, updated_actor_type) values
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'Owner', 'Acesso completo ao Studio', 'SYSTEM', 'SYSTEM');

insert into user_roles (studio_id, user_id, role_id) values
  ('70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001');

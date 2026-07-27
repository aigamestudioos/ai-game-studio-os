-- Corrige recursão infinita nas políticas de RLS (Sprint 1.8d-1).
--
-- Bug real encontrado ao testar o bootstrap de Studio contra Postgres real:
-- toda política "*_isolation" criada no Sprint 1.7 usa
-- `studio_id = (select studio_id from users where id = auth.uid())` — essa
-- subquery lê da própria tabela `users`, que tem RLS habilitado, então a
-- MESMA política dispara de novo para resolver a subquery → recursão
-- infinita ("infinite recursion detected in policy for relation users").
-- Isso nunca foi pego no Sprint 1.7 porque a validação de então só conferiu
-- `pg_class.relrowsecurity = true` (RLS habilitado), não que as políticas
-- realmente funcionassem sob um usuário autenticado de verdade.
--
-- Fix padrão do Supabase/Postgres: mover a subquery para uma função
-- SECURITY DEFINER — como ela roda com o privilégio do dono (bypassa RLS
-- internamente), a leitura de `users` não reaciona a própria política.
create or replace function public.current_user_studio_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select studio_id from public.users where id = auth.uid()
$$;

grant execute on function public.current_user_studio_id() to authenticated;

-- studios: caso especial, compara `id` (é a própria raiz), não `studio_id`.
drop policy if exists studios_isolation on studios;
create policy studios_isolation on studios
  using (id = public.current_user_studio_id());

drop policy if exists users_isolation on users;
create policy users_isolation on users
  using (studio_id = public.current_user_studio_id());

drop policy if exists roles_isolation on roles;
create policy roles_isolation on roles
  using (studio_id = public.current_user_studio_id());

drop policy if exists role_permissions_isolation on role_permissions;
create policy role_permissions_isolation on role_permissions
  using (studio_id = public.current_user_studio_id());

drop policy if exists user_roles_isolation on user_roles;
create policy user_roles_isolation on user_roles
  using (studio_id = public.current_user_studio_id());

drop policy if exists environments_isolation on environments;
create policy environments_isolation on environments
  using (studio_id = public.current_user_studio_id());

drop policy if exists games_isolation on games;
create policy games_isolation on games
  using (studio_id = public.current_user_studio_id());

drop policy if exists game_versions_isolation on game_versions;
create policy game_versions_isolation on game_versions
  using (studio_id = public.current_user_studio_id());

drop policy if exists builds_isolation on builds;
create policy builds_isolation on builds
  using (studio_id = public.current_user_studio_id());

drop policy if exists releases_isolation on releases;
create policy releases_isolation on releases
  using (studio_id = public.current_user_studio_id());

drop policy if exists game_localizations_isolation on game_localizations;
create policy game_localizations_isolation on game_localizations
  using (studio_id = public.current_user_studio_id());

drop policy if exists knowledge_documents_isolation on knowledge_documents;
create policy knowledge_documents_isolation on knowledge_documents
  using (studio_id = public.current_user_studio_id());

drop policy if exists knowledge_document_versions_isolation on knowledge_document_versions;
create policy knowledge_document_versions_isolation on knowledge_document_versions
  using (studio_id = public.current_user_studio_id());

drop policy if exists knowledge_document_relations_isolation on knowledge_document_relations;
create policy knowledge_document_relations_isolation on knowledge_document_relations
  using (studio_id = public.current_user_studio_id());

drop policy if exists ideas_isolation on ideas;
create policy ideas_isolation on ideas
  using (studio_id = public.current_user_studio_id());

drop policy if exists projects_isolation on projects;
create policy projects_isolation on projects
  using (studio_id = public.current_user_studio_id());

drop policy if exists epics_isolation on epics;
create policy epics_isolation on epics
  using (studio_id = public.current_user_studio_id());

drop policy if exists features_isolation on features;
create policy features_isolation on features
  using (studio_id = public.current_user_studio_id());

drop policy if exists tasks_isolation on tasks;
create policy tasks_isolation on tasks
  using (studio_id = public.current_user_studio_id());

drop policy if exists milestones_isolation on milestones;
create policy milestones_isolation on milestones
  using (studio_id = public.current_user_studio_id());

drop policy if exists studio_events_isolation on studio_events;
create policy studio_events_isolation on studio_events
  using (studio_id = public.current_user_studio_id());

drop policy if exists user_dashboard_preferences_isolation on user_dashboard_preferences;
create policy user_dashboard_preferences_isolation on user_dashboard_preferences
  using (studio_id = public.current_user_studio_id());

drop policy if exists certificates_isolation on certificates;
create policy certificates_isolation on certificates
  using (studio_id = public.current_user_studio_id());

drop policy if exists provision_profiles_isolation on provision_profiles;
create policy provision_profiles_isolation on provision_profiles
  using (studio_id = public.current_user_studio_id());

drop policy if exists store_connections_isolation on store_connections;
create policy store_connections_isolation on store_connections
  using (studio_id = public.current_user_studio_id());

drop policy if exists submissions_isolation on submissions;
create policy submissions_isolation on submissions
  using (studio_id = public.current_user_studio_id());

drop policy if exists store_reviews_isolation on store_reviews;
create policy store_reviews_isolation on store_reviews
  using (studio_id = public.current_user_studio_id());

-- Sprint 2.7 — Gerenciar membros existentes (trocar papel / remover).
--
-- Achado real ao planejar este sprint (não hipotético): `users_isolation` e
-- `user_roles_isolation` (Sprint 1.7, ajustadas no Sprint 1.8d-1 só para
-- corrigir recursão) eram políticas únicas de `studio_id = current_user_
-- studio_id()`, sem nenhum gate de permissão — diferente de `invites`/
-- `studios`, que já ganharam `studio.manage_members`/`studio.edit` no
-- Sprint 1.8d-4. Na prática, qualquer membro do Studio já podia UPDATE/
-- DELETE a linha de `users`/`user_roles` de qualquer outro membro. Nenhuma
-- UI expunha isso ainda (só SELECT era usado até este sprint — ver
-- packages/database/src/repositories/users-repository.ts), mas a permissão
-- de escrita já existia aberta no banco. Fechada agora, antes de adicionar a
-- primeira UI que de fato escreve nessas tabelas.

-- users: SELECT continua aberto ao Studio inteiro (lista de membros). UPDATE
-- exige studio.manage_members e nunca pode alterar a linha do Owner (nem
-- para arquivar/remover, nem qualquer outro campo) — o Owner só pode ser
-- alterado por si mesmo, e isso não é usado por nenhuma UI hoje.
drop policy if exists users_isolation on users;

create policy users_select on users
  for select
  using (studio_id = public.current_user_studio_id());

create policy users_update on users
  for update
  using (studio_id = public.current_user_studio_id())
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('studio.manage_members')
    and id <> (select owner_user_id from studios where id = public.current_user_studio_id())
  );

-- user_roles: SELECT aberto (mostrar papel de cada membro). INSERT/DELETE
-- exigem studio.manage_members; nunca podem tocar a role "Owner" — trocar o
-- papel de alguém é modelado como DELETE da role atual + INSERT da nova
-- (ver ReleasesRepository/GameVersionsRepository para o mesmo padrão de
-- "sem UPDATE parcial" já usado no projeto), nunca um UPDATE direto.
drop policy if exists user_roles_isolation on user_roles;

create policy user_roles_select on user_roles
  for select
  using (studio_id = public.current_user_studio_id());

create policy user_roles_insert on user_roles
  for insert
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('studio.manage_members')
    and role_id not in (select id from roles where studio_id = public.current_user_studio_id() and name = 'Owner')
  );

create policy user_roles_delete on user_roles
  for delete
  using (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('studio.manage_members')
    and role_id not in (select id from roles where studio_id = public.current_user_studio_id() and name = 'Owner')
  );

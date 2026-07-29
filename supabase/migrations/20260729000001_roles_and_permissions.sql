-- Papéis e permissões reais (Sprint 1.8d-4). Até aqui, "Owner"/"Member" eram
-- só rótulos exibidos na UI — `permissions`/`role_permissions` existiam
-- desde o Sprint 1.7 mas vazios, sem nenhum enforcement de verdade.

-- Catálogo global de permissões (DATA_MODEL.md §4.2: permissions é global,
-- sem studio_id — decisão do Sprint 1.7). Só as capacidades que já têm uma
-- ação real na UI hoje; não antecipar permissões para funcionalidades que
-- ainda não existem.
insert into permissions (key, description) values
  ('studio.edit', 'Editar nome e logo do Studio'),
  ('studio.invite_members', 'Convidar novos membros para o Studio'),
  ('studio.manage_members', 'Cancelar convites e remover membros do Studio')
on conflict (key) do nothing;

-- Função de verificação de permissão — usada tanto em RLS (WITH CHECK)
-- quanto nas Server Actions, para checagem antecipada com mensagem amigável.
-- SECURITY DEFINER: bypassa RLS internamente pelo mesmo motivo de
-- current_user_studio_id() (Sprint 1.8d-1) — sem isso, a própria leitura de
-- user_roles/role_permissions para verificar a permissão recairia na
-- política de RLS dessas tabelas.
create or replace function public.current_user_has_permission(p_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid() and p.key = p_key
  )
$$;

grant execute on function public.current_user_has_permission(text) to authenticated;

-- Enforcement real: só quem tem a permissão pode convidar/gerenciar membros.
-- SELECT continua aberto a qualquer membro do Studio (ver todos os convites
-- pendentes é razoável para qualquer papel, só criar/cancelar é restrito).
drop policy if exists invites_isolation on invites;

create policy invites_select on invites
  for select
  using (studio_id = public.current_user_studio_id());

create policy invites_insert on invites
  for insert
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('studio.invite_members')
  );

create policy invites_update on invites
  for update
  using (studio_id = public.current_user_studio_id())
  with check (
    studio_id = public.current_user_studio_id()
    and public.current_user_has_permission('studio.manage_members')
  );

-- Studio: editar nome/logo exige studio.edit (Sprint 1.8d-2 não tinha
-- nenhuma restrição de papel — qualquer membro podia editar).
drop policy if exists studios_isolation on studios;

create policy studios_select on studios
  for select
  using (id = public.current_user_studio_id());

create policy studios_update on studios
  for update
  using (id = public.current_user_studio_id())
  with check (
    id = public.current_user_studio_id()
    and public.current_user_has_permission('studio.edit')
  );

-- Atualiza o bootstrap: Studio novo ganha os 3 papéis (Owner, Admin, Member)
-- com as permissões corretas já vinculadas, em vez de só "Owner" — convites
-- futuros para "Admin"/"Member" encontram o papel já pronto, sem precisar
-- adivinhar quais permissões conceder na hora de aceitar um convite.
create or replace function public.bootstrap_studio_for_current_user(p_studio_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_studio_id uuid;
  v_email text;
  v_name text;
  v_owner_role_id uuid;
  v_admin_role_id uuid;
  v_member_role_id uuid;
  v_invite_id uuid;
  v_invite_studio_id uuid;
  v_invite_role_name text;
  v_invite_role_id uuid;
begin
  if v_user_id is null then
    raise exception 'bootstrap_studio_for_current_user requer um usuário autenticado';
  end if;

  select studio_id into v_studio_id from public.users where id = v_user_id;
  if v_studio_id is not null then
    return v_studio_id;
  end if;

  select email, coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1))
    into v_email, v_name
    from auth.users
    where id = v_user_id;

  -- Convite pendente? Entra no Studio convidante em vez de criar um novo.
  select id, studio_id, role_name
    into v_invite_id, v_invite_studio_id, v_invite_role_name
    from invites
    where email = v_email and status = 'pending'
    order by created_at desc
    limit 1;

  if v_invite_studio_id is not null then
    v_studio_id := v_invite_studio_id;

    insert into users (id, studio_id, email, name, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
    values (v_user_id, v_studio_id, v_email, v_name, 'USER', v_user_id, 'USER', v_user_id);

    select id into v_invite_role_id from roles where studio_id = v_studio_id and name = v_invite_role_name;
    if v_invite_role_id is null then
      -- Studio criado antes deste migration (sem Admin/Member pré-criados) —
      -- fallback seguro: cria o papel sem nenhuma permissão vinculada, em vez
      -- de adivinhar o que ele deveria poder fazer.
      insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
      values (v_studio_id, v_invite_role_name, 'Criado automaticamente ao aceitar convite', 'SYSTEM', v_user_id, 'SYSTEM', v_user_id)
      returning id into v_invite_role_id;
    end if;

    insert into user_roles (studio_id, user_id, role_id) values (v_studio_id, v_user_id, v_invite_role_id);

    update invites set status = 'accepted', accepted_at = now() where id = v_invite_id;

    return v_studio_id;
  end if;

  -- Sem convite: cria Studio novo com os 3 papéis padrão.
  insert into studios (name, owner_user_id, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (p_studio_name, v_user_id, 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_studio_id;

  insert into users (id, studio_id, email, name, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_user_id, v_studio_id, v_email, v_name, 'USER', v_user_id, 'USER', v_user_id);

  insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_studio_id, 'Owner', 'Acesso completo ao Studio', 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_owner_role_id;

  insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_studio_id, 'Admin', 'Gerencia membros e configurações do Studio', 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_admin_role_id;

  insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_studio_id, 'Member', 'Acesso básico ao Studio', 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_member_role_id;

  insert into role_permissions (studio_id, role_id, permission_id)
  select v_studio_id, v_owner_role_id, id from permissions;

  insert into role_permissions (studio_id, role_id, permission_id)
  select v_studio_id, v_admin_role_id, id from permissions where key in ('studio.invite_members', 'studio.manage_members');

  insert into user_roles (studio_id, user_id, role_id)
  values (v_studio_id, v_user_id, v_owner_role_id);

  return v_studio_id;
end;
$$;

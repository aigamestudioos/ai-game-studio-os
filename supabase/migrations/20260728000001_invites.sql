-- Convites (Sprint 1.8d-3). Entidade nova — não prevista em DATA_MODEL.md/
-- AGSOS-SPEC-002 (que não cobriam múltiplos membros por Studio ainda).
--
-- Sem tabela de "tokens" própria: o envio real do email e o link mágico são
-- responsabilidade nativa do Supabase Auth (`admin.inviteUserByEmail`,
-- chamado a partir de uma Server Action em apps/web — única forma de acessar
-- essa API, é admin-only). Esta tabela só guarda a intenção do convite
-- (para qual Studio, com qual papel) para que o bootstrap saiba, quando esse
-- email fizer login pela primeira vez, que deve entrar num Studio existente
-- em vez de criar um novo.
create table invites (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id),
  email text not null,
  invited_by_user_id uuid not null references users(id),
  role_name text not null default 'Member',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz null
);

-- Não usa `unique (studio_id, email)` simples porque um convite revogado ou
-- aceito não deveria bloquear um novo convite para o mesmo email depois.
create unique index idx_invites_pending_unique on invites (studio_id, email) where status = 'pending';
create index idx_invites_studio_id on invites (studio_id);
create index idx_invites_email on invites (email);

alter table invites enable row level security;

create policy invites_isolation on invites
  using (studio_id = public.current_user_studio_id());

-- Atualiza o bootstrap (Sprint 1.8d-1) para reconhecer convite pendente:
-- se o email do novo usuário tem um convite pendente, entra nesse Studio
-- (com o papel do convite) em vez de criar um Studio novo.
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
  v_role_id uuid;
  v_invite_id uuid;
  v_invite_studio_id uuid;
  v_invite_role_name text;
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

    select id into v_role_id from roles where studio_id = v_studio_id and name = v_invite_role_name;
    if v_role_id is null then
      insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
      values (v_studio_id, v_invite_role_name, 'Criado automaticamente ao aceitar convite', 'SYSTEM', v_user_id, 'SYSTEM', v_user_id)
      returning id into v_role_id;
    end if;

    insert into user_roles (studio_id, user_id, role_id) values (v_studio_id, v_user_id, v_role_id);

    update invites set status = 'accepted', accepted_at = now() where id = v_invite_id;

    return v_studio_id;
  end if;

  -- Sem convite: cria Studio novo (fluxo original do Sprint 1.8d-1).
  insert into studios (name, owner_user_id, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (p_studio_name, v_user_id, 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_studio_id;

  insert into users (id, studio_id, email, name, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_user_id, v_studio_id, v_email, v_name, 'USER', v_user_id, 'USER', v_user_id);

  insert into roles (studio_id, name, description, created_actor_type, created_actor_id, updated_actor_type, updated_actor_id)
  values (v_studio_id, 'Owner', 'Acesso completo ao Studio', 'USER', v_user_id, 'USER', v_user_id)
  returning id into v_role_id;

  insert into user_roles (studio_id, user_id, role_id)
  values (v_studio_id, v_user_id, v_role_id);

  return v_studio_id;
end;
$$;

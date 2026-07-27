-- Bootstrap: cria Studio + profile (public.users) + Role "Owner" para o
-- usuário autenticado atual, no primeiro login (Sprint 1.8d-1).
--
-- SECURITY DEFINER porque as políticas RLS de studios/users são
-- auto-referenciais (ex.: "studio_id = (select studio_id from users where
-- id = auth.uid())") — não existe forma de o próprio usuário inserir sua
-- primeira linha sujeito a RLS, já que a subquery nunca resolve antes de a
-- linha existir. Esta função roda com privilégios elevados, mas com escopo
-- único e auditável (só cria a estrutura mínima do usuário atual — nunca
-- aceita um studio_id/user_id arbitrário), em vez de expor a service role
-- key na aplicação (apps/web) para essa operação.
--
-- Idempotente: se o usuário já tem um profile, retorna o studio_id existente
-- em vez de recriar — seguro de chamar toda vez que a app não tiver certeza
-- se o bootstrap já rodou.
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

-- Só usuários autenticados podem chamar — nunca anon.
grant execute on function public.bootstrap_studio_for_current_user(text) to authenticated;

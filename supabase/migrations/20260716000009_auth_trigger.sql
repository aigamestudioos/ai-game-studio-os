-- Trigger que popula public.users (profile) quando um novo auth.users é
-- criado — necessário para o Sprint 1.8 (login real via Supabase Auth).
--
-- NOTA: este trigger cria o profile mas NÃO define studio_id sozinho (não há
-- como saber a qual Studio um novo usuário pertence só a partir do signup —
-- depende do fluxo de produto: convite para Studio existente vs. criação de
-- Studio novo). Por ora, associa a um Studio "pendente" via metadata; a
-- lógica real de onboarding (criar Studio no primeiro signup, ou aceitar
-- convite) é uma decisão de fluxo de produto para o Sprint 1.8, não de
-- schema — deixada como TODO explícito aqui.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- TODO (Sprint 1.8): resolver studio_id real (onboarding: criar Studio novo
  -- vs. aceitar convite existente). Por enquanto, não insere — a criação do
  -- profile fica a cargo do fluxo de aplicação até essa decisão ser tomada,
  -- para não inserir um studio_id incorreto/fictício silenciosamente.
  return new;
end;
$$;

-- Trigger criado mas função é um no-op proposital (ver TODO acima) — mantém
-- o ponto de extensão pronto sem tomar uma decisão de produto no schema.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

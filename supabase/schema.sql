-- Organizador financeiro — schema + RLS
-- Execute no SQL Editor do Supabase (projeto novo).

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  salario_bruto numeric(12, 2) not null default 0,
  descontos numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  papel text not null check (papel in ('owner', 'member')),
  primary key (household_id, user_id)
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa'))
);

create table public.transacoes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  categoria_id uuid not null references public.categorias (id) on delete restrict,
  criado_por uuid not null references auth.users (id) on delete restrict,
  valor numeric(12, 2) not null check (valor >= 0),
  data_transacao date not null,
  descricao text not null default '',
  status text not null check (status in ('pago', 'pendente')),
  pago_por uuid not null references auth.users (id) on delete restrict
);

create table public.dividas (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  nome text not null,
  credor text not null default '',
  parcela_mensal numeric(12, 2) not null default 0,
  total_parcelas int not null default 1 check (total_parcelas >= 1),
  data_inicio date not null default current_date,
  dia_vencimento int not null default 1 check (dia_vencimento between 1 and 31),
  ativa boolean not null default true
);

create index household_members_user_id_idx on public.household_members (user_id);
create index categorias_household_id_idx on public.categorias (household_id);
create index transacoes_household_id_idx on public.transacoes (household_id);
create index transacoes_categoria_id_idx on public.transacoes (categoria_id);
create index dividas_household_id_idx on public.dividas (household_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into public.profiles (id, nome, salario_bruto, descontos)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    0,
    0
  );

  select hm.household_id into new_household_id
  from public.household_members hm
  where hm.user_id = new.id
  limit 1;

  if new_household_id is null then
    insert into public.households (nome) values ('Nosso lar')
    returning id into new_household_id;

    insert into public.household_members (household_id, user_id, papel)
    values (new_household_id, new.id, 'owner');

    insert into public.categorias (household_id, nome, tipo) values
      (new_household_id, 'Renda extra', 'receita'),
      (new_household_id, 'Mercado', 'despesa'),
      (new_household_id, 'Aluguel', 'despesa'),
      (new_household_id, 'Lazer', 'despesa'),
      (new_household_id, 'Transporte', 'despesa');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.user_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.household_members where user_id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.categorias enable row level security;
alter table public.transacoes enable row level security;
alter table public.dividas enable row level security;

create policy "profiles_select_household"
  on public.profiles for select
  using (
    id = auth.uid()
    or id in (
      select hm2.user_id from public.household_members hm1
      join public.household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid()
    )
  );

-- Qualquer membro do household pode atualizar salários do casal
create policy "profiles_update_household"
  on public.profiles for update
  using (
    id in (
      select hm2.user_id from public.household_members hm1
      join public.household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid()
    )
  )
  with check (
    id in (
      select hm2.user_id from public.household_members hm1
      join public.household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid()
    )
  );

create policy "households_member_access"
  on public.households for all
  using (id in (select public.user_household_ids()))
  with check (id in (select public.user_household_ids()));

create policy "members_member_access"
  on public.household_members for all
  using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

create policy "categorias_member_access"
  on public.categorias for all
  using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

create policy "transacoes_member_access"
  on public.transacoes for all
  using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

create policy "dividas_member_access"
  on public.dividas for all
  using (household_id in (select public.user_household_ids()))
  with check (household_id in (select public.user_household_ids()));

-- Para duas pessoas compartilharem os dados, rode supabase/adicionar-parceiro.sql
-- depois de criar as duas contas.

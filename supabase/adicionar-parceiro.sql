-- Coloca a segunda pessoa no mesmo household da primeira.
-- Rode no SQL Editor depois de criar as duas contas em Authentication > Users.
-- Troque os e-mails e os nomes antes de executar.

-- 1. Apaga o household que o gatilho criou automaticamente para a segunda pessoa
delete from public.households
where id in (
  select household_id from public.household_members
  where user_id = (select id from auth.users where email = 'segunda@exemplo.com')
);

-- 2. Adiciona a segunda pessoa como membro do household da primeira
insert into public.household_members (household_id, user_id, papel)
select hm.household_id, segunda.id, 'member'
from public.household_members hm
join auth.users primeira on primeira.id = hm.user_id
cross join auth.users segunda
where primeira.email = 'primeira@exemplo.com'
  and segunda.email = 'segunda@exemplo.com'
  and hm.papel = 'owner';

-- 3. Define os nomes que aparecem no app
update public.profiles set nome = 'Nome 1'
where id = (select id from auth.users where email = 'primeira@exemplo.com');

update public.profiles set nome = 'Nome 2'
where id = (select id from auth.users where email = 'segunda@exemplo.com');

-- Conferência: deve listar as duas pessoas no mesmo household
select h.nome as household, p.nome, hm.papel
from public.household_members hm
join public.households h on h.id = hm.household_id
join public.profiles p on p.id = hm.user_id;

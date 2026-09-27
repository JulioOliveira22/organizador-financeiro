# Organizador de Finanças

Aplicação web que eu fiz para organizar as finanças de casa junto com a minha noiva. A ideia é ter num lugar só os salários, os gastos do mês, as compras parceladas no cartão e quanto sobra no fim do mês.

## Funcionalidades

- **Resumo do mês:** salários líquidos, rendas extras, gastos, parcelas e a sobra, com gráfico de gastos por categoria.
- **Holerites:** salário bruto e descontos de cada um, com o líquido calculado.
- **Lançamentos:** receitas e despesas do mês, com categoria, status (pago/pendente) e quem pagou.
- **Dívidas e parcelamentos:** compras parceladas com número de parcelas e mês de início. O app mostra em qual parcela cada compra está, quanto falta pagar e o calendário das parcelas.
- **Categorias:** categorias de receita e despesa personalizáveis.
- Navegação por mês em todas as telas.

## Tecnologias

- React 19 + TypeScript + Vite
- Tailwind CSS 4 e componentes do shadcn/ui
- Zustand (estado global)
- Recharts (gráficos)
- date-fns (datas)
- Supabase (PostgreSQL, autenticação e Row Level Security)

## Rodando localmente

```bash
npm install
npm run dev
```

Sem arquivo `.env`, o app roda em **modo demonstração**: os dados ficam salvos no `localStorage` do navegador e já vêm com alguns exemplos. Para entrar:

- `lucas@demo.dev` ou `marina@demo.dev`
- senha: `123456`

Outros scripts:

```bash
npm run build     # gera a versão de produção em dist/
npm run preview   # serve o build localmente
npm run lint      # roda o oxlint
```

## Usando com o Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. No **SQL Editor**, execute o arquivo [`supabase/schema.sql`](supabase/schema.sql). Ele cria as tabelas, as políticas de RLS e um gatilho que monta o perfil e as categorias iniciais de cada usuário novo.
3. Copie o `.env.example` para `.env` e preencha:

```env
VITE_DATA_SOURCE=supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

4. Crie os usuários pelo painel do Supabase (**Authentication → Users**). O app não tem tela de cadastro, então vale desativar o cadastro público em **Authentication → Sign In / Providers**.
5. Para que duas pessoas compartilhem os mesmos dados, a segunda precisa ser adicionada ao `household` da primeira. O comando está comentado no final do `schema.sql`.

## Estrutura

```
src/
  app/            # inicialização e rotas
  components/     # layout, componentes compartilhados e ui (shadcn)
  pages/          # telas: login, resumo, lançamentos, dívidas, categorias
  repositories/   # acesso a dados (modo demonstração e Supabase)
  lib/            # formatação e cálculos financeiros
  stores/         # estado global
  types/          # tipos do domínio
supabase/
  schema.sql      # tabelas, gatilhos e políticas de RLS
```

A camada `repositories` segue uma interface única (`FinanceRepository`), então as telas não sabem se os dados vêm do `localStorage` ou do Supabase. A escolha é feita pela variável `VITE_DATA_SOURCE`.

## Hospedagem

O app é de uso pessoal e não fica exposto na internet. O build roda numa VM Linux acessível apenas pela rede privada do [Tailscale](https://tailscale.com).

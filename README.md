# Organizador financeiro (casal)

App web para controle compartilhado de receitas, despesas, dívidas e sobra mensal.

## Stack

- Vite + React + TypeScript + Tailwind + shadcn/ui
- Dados: **mock (localStorage)** ou **Supabase** (Postgres + Auth + RLS)
- Deploy: Netlify (SPA)

## Rodar local

```bash
npm install
npm run dev
```

Modo mock (padrão, sem `.env`):

- `lucas@demo.dev` / `marina@demo.dev` — senha `123456`

## Estrutura do projeto

```
src/
  app/                 # Bootstrap da aplicação e rotas
  components/
    layout/            # Shell, proteção de rotas
    shared/            # Componentes reutilizáveis (MonthPicker…)
    ui/                # shadcn/ui
  pages/               # Telas por domínio (auth, dashboard, …)
  repositories/        # Camada de dados (mock | supabase)
  lib/                 # Utilitários puros (format, cn, cálculos)
  stores/              # Estado global (Zustand)
  types/               # Tipos TypeScript do domínio
  styles/              # CSS global / tema
supabase/
  schema.sql           # DDL + RLS (Fase B)
```

## Supabase (Fase B)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute [`supabase/schema.sql`](supabase/schema.sql).
3. Copie `.env.example` para `.env` e preencha URL + anon key.
4. Defina `VITE_DATA_SOURCE=supabase`.
5. Cadastre-se pelo app; convide a parceira em `household_members` (instrução no final do `schema.sql`).

## Netlify

Conecte o repositório GitHub. Build: `npm run build`, publish: `dist`.  
Configure as mesmas variáveis `VITE_*` no painel da Netlify.

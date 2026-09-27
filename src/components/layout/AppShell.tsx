import { LayoutDashboard, LineChart, List, LogOut, Tags, Wallet } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

const nav = [
  { to: '/', label: 'Resumo', icon: LayoutDashboard },
  { to: '/transacoes', label: 'Lançamentos', icon: List },
  { to: '/categorias', label: 'Categorias', icon: Tags },
  { to: '/dividas', label: 'Dívidas', icon: Wallet },
]

export function AppShell() {
  const signOut = useAppStore((s) => s.signOut)

  return (
    <div className="min-h-svh bg-slate-100 md:flex">
      <aside className="sticky top-0 z-20 hidden h-svh shrink-0 flex-col p-3 md:flex lg:p-4">
        <div className="flex h-full w-[4.75rem] flex-col overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-2xl shadow-slate-900/40 ring-1 ring-white/10 lg:w-56">
          {/* Marca tipográfica — sem bolinha OF */}
          <div className="px-2 pb-4 pt-6 lg:px-5">
            <div className="flex justify-center lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <LineChart className="size-5 text-sky-400" strokeWidth={2} />
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="flex gap-3">
                <span className="mt-1 h-9 w-1 shrink-0 rounded-full bg-gradient-to-b from-sky-400 to-blue-600" />
                <div className="min-w-0">
                  <p className="mt-1 text-[15px] font-semibold leading-[1.25] tracking-tight text-white">
                    Organizador
                    <br />
                    <span className="text-sky-300">de Finanças</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mx-4 mb-2 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block"
            aria-hidden
          />

          <nav className="flex flex-1 flex-col gap-1.5 px-2 py-2 lg:px-3">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5 text-center transition-all duration-200 lg:flex-row lg:gap-3 lg:px-3 lg:py-2.5 lg:text-left',
                    isActive
                      ? 'bg-white/10 text-white shadow-inner'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white',
                    isActive &&
                      '[&_.nav-icon]:bg-sky-500 [&_.nav-icon]:text-white [&_.nav-icon]:shadow-lg [&_.nav-icon]:shadow-sky-500/50',
                    isActive && '[&_.nav-rail]:opacity-100',
                  )
                }
              >
                <span className="nav-rail absolute left-0 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-full bg-sky-400 opacity-0 lg:block" />
                <span className="nav-icon flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 transition-all">
                  <Icon className="size-[18px]" strokeWidth={2} />
                </span>
                <span className="max-w-full truncate text-[9px] font-semibold leading-tight lg:text-[13px]">
                  {label}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="px-2 pb-4 lg:px-3">
            <button
              type="button"
              onClick={() => signOut()}
              className="flex w-full flex-col items-center gap-1 rounded-2xl px-1.5 py-2.5 text-slate-500 transition-colors hover:bg-rose-500/15 hover:text-rose-300 lg:flex-row lg:gap-3 lg:px-3"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/5">
                <LogOut className="size-[18px]" strokeWidth={2} />
              </span>
              <span className="text-[9px] font-semibold lg:text-[13px]">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-1 rounded-full bg-gradient-to-b from-sky-400 to-blue-600" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Casal
              </p>
              <p className="text-sm font-semibold leading-tight tracking-tight text-slate-900">
                Organizador de Finanças
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => signOut()}>
            Sair
          </Button>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-28 md:px-6 md:py-8 lg:px-10">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-10 px-4 pb-4 md:hidden">
          <div className="mx-auto flex max-w-md items-stretch justify-around gap-1 rounded-2xl bg-slate-950 p-1.5 shadow-2xl shadow-slate-900/50 ring-1 ring-white/10">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[9px] font-semibold transition-colors',
                    isActive
                      ? 'bg-white/10 text-white [&_.dock-icon]:bg-sky-500 [&_.dock-icon]:text-white [&_.dock-icon]:shadow-md [&_.dock-icon]:shadow-sky-500/50'
                      : 'text-slate-400 hover:text-slate-200',
                  )
                }
              >
                <span className="dock-icon flex size-8 items-center justify-center rounded-lg transition-all">
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}

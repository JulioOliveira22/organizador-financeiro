import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  CreditCard,
  Pencil,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { MonthPicker } from '@/components/shared/MonthPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  despesasPorCategoria,
  parcelamentosFuturos,
  parcelasNoMes,
  summarizeMonth,
} from '@/lib/finance/calculations'
import { formatCurrency } from '@/lib/format'
import { CHART_PREMIUM, initials, partnerRole, partnerTheme } from '@/lib/couple-theme'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
import { salarioLiquido, type Profile } from '@/types/finance'

export function DashboardPage() {
  const month = useAppStore((s) => s.month)
  const profiles = useAppStore((s) => s.profiles)
  const transacoes = useAppStore((s) => s.transacoes)
  const categorias = useAppStore((s) => s.categorias)
  const dividas = useAppStore((s) => s.dividas)
  const updateProfile = useAppStore((s) => s.updateProfile)

  const [editing, setEditing] = useState<Profile | null>(null)
  const [bruto, setBruto] = useState('')
  const [descontos, setDescontos] = useState('')

  const resumo = useMemo(
    () => summarizeMonth(profiles, transacoes, categorias, dividas, month),
    [profiles, transacoes, categorias, dividas, month],
  )

  const breakdown = useMemo(
    () => despesasPorCategoria(transacoes, categorias, month),
    [transacoes, categorias, month],
  )

  const parcelasMes = useMemo(() => parcelasNoMes(dividas, month), [dividas, month])
  const parcelasFuturas = useMemo(
    () => parcelamentosFuturos(dividas, month),
    [dividas, month],
  )

  const saidasDetalhe = useMemo(() => {
    const rows: {
      key: string
      nome: string
      total: number
      tipo: 'gasto' | 'parcela'
      sub?: string
    }[] = [
      ...breakdown.map((b) => ({
        key: b.categoriaId,
        nome: b.nome,
        total: b.total,
        tipo: 'gasto' as const,
      })),
      ...parcelasMes.map((p) => ({
        key: `parcela-${p.divida.id}`,
        nome: p.divida.nome,
        total: p.valor,
        tipo: 'parcela' as const,
        sub: `${p.numero}/${p.total}`,
      })),
    ]
    return rows.sort((a, b) => b.total - a.total)
  }, [breakdown, parcelasMes])

  const chartData = saidasDetalhe.map((b) => ({ name: b.nome, value: b.total }))
  const liquidoDraft = Math.max(0, (Number(bruto) || 0) - (Number(descontos) || 0))

  function openEdit(profile: Profile) {
    setEditing(profile)
    setBruto(String(profile.salarioBruto || 0))
    setDescontos(String(profile.descontos || 0))
  }

  async function saveSalary() {
    if (!editing) return
    await updateProfile(editing.id, {
      salarioBruto: Number(bruto) || 0,
      descontos: Number(descontos) || 0,
    })
    setEditing(null)
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Resumo do mês
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Renda líquida, gastos, parcelas e sobra.
          </p>
        </div>
        <MonthPicker />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="Salários"
          value={resumo.salariosLiquidos}
          icon={Wallet}
          iconWrap="bg-blue-100 text-blue-600"
        />
        <Metric
          label="Extras"
          value={resumo.outrasReceitas}
          icon={TrendingUp}
          iconWrap="bg-sky-100 text-sky-600"
        />
        <Metric
          label="Gastos"
          value={resumo.despesas}
          icon={Receipt}
          iconWrap="bg-rose-100 text-rose-600"
        />
        <Metric
          label="Parcelas"
          value={resumo.parcelasDividas}
          icon={CreditCard}
          iconWrap="bg-violet-100 text-violet-600"
        />
        <Metric
          label="Sobra"
          value={resumo.sobra}
          icon={PiggyBank}
          highlight
          tone={resumo.sobra >= 0 ? 'positive' : 'negative'}
        />
      </section>

      {resumo.sobra < 0 && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
          As saídas passam da renda em {formatCurrency(Math.abs(resumo.sobra))}.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Holerites</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p) => {
            const role = partnerRole(profiles, p.id)
            const theme = partnerTheme[role]
            return (
              <Card key={p.id} className={cn('overflow-visible border-0 shadow-none', theme.card)}>
                <CardContent className="flex items-start justify-between gap-3 p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold',
                        theme.avatar,
                      )}
                    >
                      {initials(p.nome)}
                    </div>
                    <div>
                      <span
                        className={cn(
                          'inline-block rounded-lg px-2 py-0.5 text-[11px]',
                          theme.tag,
                        )}
                      >
                        {p.nome}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        Bruto {formatCurrency(p.salarioBruto)} · descontos{' '}
                        {formatCurrency(p.descontos)}
                      </p>
                      <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                        {formatCurrency(salarioLiquido(p))}
                      </p>
                      <p className="text-xs font-medium text-slate-500">líquido mensal</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className={cn('rounded-xl shadow-none', theme.editBtn)}
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Parcelas do mês
        </h2>
        {parcelasMes.length === 0 ? (
          <Card className="border border-slate-200/80">
            <CardContent className="p-5 text-sm text-slate-500">
              Nenhuma parcela neste mês.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {parcelasMes.map((p) => (
              <Card
                key={p.divida.id}
                className="overflow-hidden border border-sky-200 bg-gradient-to-br from-sky-50 to-white shadow-sm shadow-sky-500/10"
              >
                <CardContent className="relative p-5">
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-sky-400 to-blue-600" />
                  <div className="flex items-start justify-between gap-3 pl-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{p.divida.nome}</p>
                        <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-sky-800">
                          {p.numero}/{p.total}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {p.divida.credor ? `${p.divida.credor} · ` : ''}
                        vence dia {p.divida.diaVencimento}
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-bold tabular-nums text-slate-900">
                      {formatCurrency(p.valor)}
                    </p>
                  </div>
                  <div className="mt-3 pl-2">
                    <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 transition-all"
                        style={{ width: `${(p.numero / p.total) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                      {p.total - p.numero} restante{p.total - p.numero === 1 ? '' : 's'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {parcelasFuturas.length > 0 && (
          <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="space-y-2 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">
                Começam depois
              </p>
              <ul className="space-y-2">
                {parcelasFuturas.map(({ divida, inicioLabel }) => (
                  <li key={divida.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {divida.nome}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {divida.totalParcelas}x · a partir de {inicioLabel}
                      </span>
                    </span>
                    <span className="font-bold tabular-nums text-slate-800">
                      {formatCurrency(divida.parcelaMensal)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-slate-200/80 bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-slate-600">Saídas do mês</CardTitle>
          </CardHeader>
          <CardContent className="flex h-56 items-center justify-center">
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-500">Sem saídas neste mês.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={78}
                    paddingAngle={3}
                    stroke="#fff"
                    strokeWidth={3}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_PREMIUM[i % CHART_PREMIUM.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80">
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-slate-600">Detalhe</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {saidasDetalhe.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">Nada lançado ainda.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {saidasDetalhe.map((row, i) => (
                  <li
                    key={row.key}
                    className="flex items-center justify-between px-5 py-3.5 text-sm"
                  >
                    <span className="flex items-center gap-2.5 font-medium text-slate-700">
                      <span
                        className="size-3 shrink-0 rounded-full shadow-sm"
                        style={{ backgroundColor: CHART_PREMIUM[i % CHART_PREMIUM.length] }}
                      />
                      {row.nome}
                      {row.tipo === 'parcela' && (
                        <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-sky-700">
                          {row.sub ?? 'parcela'}
                        </span>
                      )}
                    </span>
                    <span className="font-bold tabular-nums text-slate-900">
                      {formatCurrency(row.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Holerite — {editing?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="bruto">Bruto (R$)</Label>
              <Input
                id="bruto"
                type="number"
                min="0"
                step="0.01"
                value={bruto}
                onChange={(e) => setBruto(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descontos (R$)</Label>
              <Input
                id="desc"
                type="number"
                min="0"
                step="0.01"
                value={descontos}
                onChange={(e) => setDescontos(e.target.value)}
              />
              <p className="text-xs text-slate-500">INSS, IRRF e demais descontos do holerite.</p>
            </div>
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Líquido:{' '}
              <strong className="tabular-nums">{formatCurrency(liquidoDraft)}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </Button>
            <Button type="button" className="rounded-xl" onClick={() => void saveSalary()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
  iconWrap,
  highlight,
  tone,
}: {
  label: string
  value: number
  icon: LucideIcon
  iconWrap?: string
  highlight?: boolean
  tone?: 'positive' | 'negative'
}) {
  const positive = highlight && tone === 'positive'
  const negative = highlight && tone === 'negative'

  return (
    <Card
      className={cn(
        'overflow-visible border',
        positive && 'border-emerald-200 bg-emerald-50 shadow-sm shadow-emerald-500/10',
        negative && 'border-rose-200 bg-rose-50 shadow-sm shadow-rose-500/10',
        !highlight && 'border-slate-200/80 bg-white',
      )}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-xs font-bold uppercase tracking-wide',
              positive ? 'text-emerald-700' : negative ? 'text-rose-600' : 'text-slate-500',
            )}
          >
            {label}
          </p>
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-xl',
              positive && 'bg-emerald-100 text-emerald-700',
              negative && 'bg-rose-100 text-rose-600',
              !highlight && iconWrap,
            )}
          >
            <Icon className="size-5" strokeWidth={2.25} />
          </span>
        </div>
        <p
          className={cn(
            'text-2xl font-bold tabular-nums leading-tight',
            positive && 'text-emerald-700',
            negative && 'text-rose-600',
            !highlight && 'text-slate-900',
          )}
        >
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  )
}

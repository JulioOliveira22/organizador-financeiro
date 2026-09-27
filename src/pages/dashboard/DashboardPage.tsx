import { useMemo, useState } from 'react'
import { format, getDaysInMonth, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
  parcelamentosFuturos,
  parcelasNoMes,
  summarizeMonth,
  transacaoInMonth,
  vencimentoNoMes,
} from '@/lib/finance/calculations'
import { formatCurrency, monthKey, parseLocalDate } from '@/lib/format'
import { CHART_PREMIUM, initials, partnerRole, partnerTheme } from '@/lib/couple-theme'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
import { salarioLiquido, type Profile } from '@/types/finance'

interface Saida {
  key: string
  grupo: string
  grupoNome: string
  nome: string
  info: string
  data: Date
  valor: number
  parcela?: string
}

export function DashboardPage() {
  const month = useAppStore((s) => s.month)
  const user = useAppStore((s) => s.user)
  const profiles = useAppStore((s) => s.profiles)
  const transacoes = useAppStore((s) => s.transacoes)
  const categorias = useAppStore((s) => s.categorias)
  const dividas = useAppStore((s) => s.dividas)
  const updateProfile = useAppStore((s) => s.updateProfile)

  const [editing, setEditing] = useState<Profile | null>(null)
  const [bruto, setBruto] = useState('')
  const [descontos, setDescontos] = useState('')
  const [filtroDia, setFiltroDia] = useState<{ mes: string; dia: number } | null>(null)

  const hoje = new Date()
  const dia = filtroDia?.mes === monthKey(month) ? filtroDia.dia : null
  const periodo = dia ? `do dia ${dia}` : 'do mês'

  const perfilAtual = profiles.find((p) => p.id === user?.id) ?? user
  const primeiroNome = perfilAtual?.nome.split(' ')[0] ?? ''
  const papelAtual = user ? partnerRole(profiles, user.id) : 'him'
  const saudacao = papelAtual === 'her' ? 'Bem-vinda de volta' : 'Bem-vindo de volta'

  const resumo = useMemo(
    () => summarizeMonth(profiles, transacoes, categorias, dividas, month),
    [profiles, transacoes, categorias, dividas, month],
  )

  const parcelasMes = useMemo(() => parcelasNoMes(dividas, month), [dividas, month])
  const parcelasFuturas = useMemo(
    () => parcelamentosFuturos(dividas, month),
    [dividas, month],
  )

  const saidas = useMemo(() => {
    const catMap = new Map(categorias.map((c) => [c.id, c]))
    const rows: Saida[] = []

    for (const t of transacoes) {
      if (!transacaoInMonth(t, month)) continue
      const cat = catMap.get(t.categoriaId)
      if (!cat || cat.tipo !== 'despesa') continue
      rows.push({
        key: t.id,
        grupo: cat.id,
        grupoNome: cat.nome,
        nome: t.descricao || cat.nome,
        info: cat.nome,
        data: parseLocalDate(t.dataTransacao),
        valor: t.valor,
      })
    }

    for (const p of parcelasMes) {
      rows.push({
        key: `parcela-${p.divida.id}`,
        grupo: `parcela-${p.divida.id}`,
        grupoNome: p.divida.nome,
        nome: p.divida.nome,
        info: p.divida.credor,
        data: vencimentoNoMes(p.divida, month),
        valor: p.valor,
        parcela: `${p.numero}/${p.total}`,
      })
    }

    return rows
      .filter((r) => dia == null || r.data.getDate() === dia)
      .sort((a, b) => a.data.getTime() - b.data.getTime())
  }, [transacoes, categorias, parcelasMes, month, dia])

  const cards = useMemo(() => {
    if (dia == null) {
      return {
        extras: resumo.outrasReceitas,
        gastos: resumo.despesas,
        parcelas: resumo.parcelasDividas,
        sobra: resumo.sobra,
      }
    }

    const catMap = new Map(categorias.map((c) => [c.id, c]))
    const t = { extrasDia: 0, gastosDia: 0, parcelasDia: 0, extrasAte: 0, gastosAte: 0, parcelasAte: 0 }

    for (const tx of transacoes) {
      if (!transacaoInMonth(tx, month)) continue
      const cat = catMap.get(tx.categoriaId)
      if (!cat) continue
      const d = parseLocalDate(tx.dataTransacao).getDate()
      if (d > dia) continue
      if (cat.tipo === 'receita') {
        t.extrasAte += tx.valor
        if (d === dia) t.extrasDia += tx.valor
      } else {
        t.gastosAte += tx.valor
        if (d === dia) t.gastosDia += tx.valor
      }
    }

    for (const p of parcelasMes) {
      const d = vencimentoNoMes(p.divida, month).getDate()
      if (d > dia) continue
      t.parcelasAte += p.valor
      if (d === dia) t.parcelasDia += p.valor
    }

    return {
      extras: t.extrasDia,
      gastos: t.gastosDia,
      parcelas: t.parcelasDia,
      sobra: resumo.salariosLiquidos + t.extrasAte - t.gastosAte - t.parcelasAte,
    }
  }, [dia, resumo, transacoes, categorias, parcelasMes, month])

  const parcelasVisiveis = parcelasMes.filter(
    (p) => dia == null || vencimentoNoMes(p.divida, month).getDate() === dia,
  )

  const chartData = useMemo(() => {
    const totals = new Map<string, { name: string; value: number }>()
    for (const s of saidas) {
      const atual = totals.get(s.grupo)
      if (atual) atual.value += s.valor
      else totals.set(s.grupo, { name: s.grupoNome, value: s.valor })
    }
    return [...totals.entries()]
      .map(([grupo, v]) => ({ grupo, ...v }))
      .sort((a, b) => b.value - a.value)
  }, [saidas])

  const corDoGrupo = new Map(
    chartData.map((c, i) => [c.grupo, CHART_PREMIUM[i % CHART_PREMIUM.length]]),
  )

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
          <p className="text-sm font-medium text-slate-500 first-letter:uppercase">
            {format(hoje, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {saudacao}
            {primeiroNome && (
              <>
                , <span className={partnerTheme[papelAtual].text}>{primeiroNome}</span>
              </>
            )}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker />
          <select
            aria-label="Filtrar por dia"
            className="h-9 rounded-xl border-0 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition-shadow duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500"
            value={dia ?? ''}
            onChange={(e) =>
              setFiltroDia(
                e.target.value ? { mes: monthKey(month), dia: Number(e.target.value) } : null,
              )
            }
          >
            <option value="">Mês inteiro</option>
            {Array.from({ length: getDaysInMonth(month) }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                Dia {d}
                {isSameMonth(month, hoje) && d === hoje.getDate() ? ' (hoje)' : ''}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="Salários"
          value={resumo.salariosLiquidos}
          hint={dia ? 'do mês' : undefined}
          icon={Wallet}
          iconWrap="bg-blue-100 text-blue-600"
        />
        <Metric
          label="Extras"
          value={cards.extras}
          hint={dia ? `no dia ${dia}` : undefined}
          icon={TrendingUp}
          iconWrap="bg-sky-100 text-sky-600"
        />
        <Metric
          label="Gastos"
          value={cards.gastos}
          hint={dia ? `no dia ${dia}` : undefined}
          icon={Receipt}
          iconWrap="bg-rose-100 text-rose-600"
        />
        <Metric
          label="Parcelas"
          value={cards.parcelas}
          hint={dia ? `no dia ${dia}` : undefined}
          icon={CreditCard}
          iconWrap="bg-violet-100 text-violet-600"
        />
        <Metric
          label="Sobra"
          value={cards.sobra}
          hint={dia ? `até o dia ${dia}` : undefined}
          icon={PiggyBank}
          highlight
          tone={cards.sobra >= 0 ? 'positive' : 'negative'}
        />
      </section>

      {cards.sobra < 0 && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
          As saídas passam da renda em {formatCurrency(Math.abs(cards.sobra))}
          {dia ? ` até o dia ${dia}` : ''}.
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
          Parcelas {periodo}
        </h2>
        {parcelasVisiveis.length === 0 ? (
          <Card className="border border-slate-200/80">
            <CardContent className="p-5 text-sm text-slate-500">
              {dia ? 'Nenhuma parcela vence neste dia.' : 'Nenhuma parcela neste mês.'}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {parcelasVisiveis.map((p) => (
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
                        vence {format(vencimentoNoMes(p.divida, month), 'dd/MM')}
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
            <CardTitle className="font-bold text-slate-600">Saídas {periodo}</CardTitle>
          </CardHeader>
          <CardContent className="flex h-56 items-center justify-center">
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-500">
                {dia ? 'Sem saídas neste dia.' : 'Sem saídas neste mês.'}
              </p>
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
                    {chartData.map((c) => (
                      <Cell key={c.grupo} fill={corDoGrupo.get(c.grupo)} />
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
            {saidas.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">
                {dia ? 'Nenhuma saída neste dia.' : 'Nada lançado ainda.'}
              </p>
            ) : (
              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                {saidas.map((row) => (
                  <li
                    key={row.key}
                    className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="size-3 shrink-0 rounded-full shadow-sm"
                        style={{ backgroundColor: corDoGrupo.get(row.grupo) }}
                      />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <span className="truncate">{row.nome}</span>
                          {row.parcela && (
                            <span className="shrink-0 rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-sky-700">
                              {row.parcela}
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {row.parcela ? 'vence ' : ''}
                          {format(row.data, 'dd/MM')}
                          {row.info && row.info !== row.nome ? ` · ${row.info}` : ''}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums text-slate-900">
                      {formatCurrency(row.valor)}
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
  hint,
  icon: Icon,
  iconWrap,
  highlight,
  tone,
}: {
  label: string
  value: number
  hint?: string
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
        {hint && (
          <p
            className={cn(
              '-mt-2 text-xs font-medium',
              positive ? 'text-emerald-700/70' : negative ? 'text-rose-600/70' : 'text-slate-400',
            )}
          >
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

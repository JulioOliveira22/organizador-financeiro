import { useEffect, useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { MonthPicker } from '@/components/shared/MonthPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  cronogramaParcelas,
  numeroParcelaNoMes,
  saldoRestante,
} from '@/lib/finance/calculations'
import { formatCurrency, monthKey, parseLocalDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

export function DividasPage() {
  const month = useAppStore((s) => s.month)
  const dividas = useAppStore((s) => s.dividas)
  const createDivida = useAppStore((s) => s.createDivida)
  const deleteDivida = useAppStore((s) => s.deleteDivida)
  const updateDivida = useAppStore((s) => s.updateDivida)

  const [nome, setNome] = useState('')
  const [credor, setCredor] = useState('')
  const [parcelaMensal, setParcelaMensal] = useState('')
  const [totalParcelas, setTotalParcelas] = useState('6')
  const [dataInicio, setDataInicio] = useState(monthKey(month))
  const [diaVencimento, setDiaVencimento] = useState('10')

  useEffect(() => {
    setDataInicio(monthKey(month))
  }, [month])

  const totalPreview =
    (Number(parcelaMensal) || 0) * Math.max(1, Number(totalParcelas) || 1)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = Math.max(1, Number(totalParcelas) || 1)
    const valor = Number(parcelaMensal) || 0
    await createDivida({
      nome,
      credor,
      parcelaMensal: valor,
      totalParcelas: n,
      dataInicio: `${dataInicio}-01`,
      diaVencimento: Number(diaVencimento) || 1,
      ativa: true,
    })
    setNome('')
    setCredor('')
    setParcelaMensal('')
    setTotalParcelas('6')
    setDataInicio(monthKey(month))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dívidas</h1>
          <p className="text-sm text-slate-500">
            Cada parcela só entra no resumo no mês em que vence
          </p>
        </div>
        <MonthPicker />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo parcelamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="dnome">Nome</Label>
              <Input
                id="dnome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Notebook, Viagem…"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credor">Credor / cartão</Label>
              <Input
                id="credor"
                value={credor}
                onChange={(e) => setCredor(e.target.value)}
                placeholder="Ex.: Nubank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parcela">Valor da parcela (R$)</Label>
              <Input
                id="parcela"
                type="number"
                min="0"
                step="0.01"
                value={parcelaMensal}
                onChange={(e) => setParcelaMensal(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vezes">Em quantas vezes</Label>
              <Input
                id="vezes"
                type="number"
                min="1"
                max="48"
                value={totalParcelas}
                onChange={(e) => setTotalParcelas(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inicio">Mês da 1ª parcela</Label>
              <Input
                id="inicio"
                type="month"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
              <p className="text-xs text-slate-400">
                Entra no resumo a partir de{' '}
                {format(parseLocalDate(`${dataInicio}-01`), 'MMMM yyyy', { locale: ptBR })}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dia">Dia do vencimento</Label>
              <Input
                id="dia"
                type="number"
                min="1"
                max="31"
                value={diaVencimento}
                onChange={(e) => setDiaVencimento(e.target.value)}
              />
            </div>
            <div className="flex flex-col justify-end gap-1 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Total da compra:{' '}
                <strong className="tabular-nums text-slate-900">
                  {formatCurrency(totalPreview)}
                </strong>
              </p>
              <Button type="submit" className="rounded-xl">
                Salvar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {dividas.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-slate-500">
              Nenhum parcelamento cadastrado.
            </CardContent>
          </Card>
        ) : (
          dividas.map((d) => {
            const atual = numeroParcelaNoMes(d, month)
            const restante = saldoRestante(d, month)
            const cronograma = cronogramaParcelas(d)
            const inicio = startOfMonth(parseLocalDate(d.dataInicio))
            const ref = startOfMonth(month)
            const aindaNaoComecou = ref < inicio

            return (
              <Card key={d.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">{d.nome}</p>
                        {atual != null ? (
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {atual}/{d.totalParcelas}
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            {d.totalParcelas}x
                            {aindaNaoComecou
                              ? ` · começa ${format(inicio, 'MMM/yy', { locale: ptBR })}`
                              : ' · encerrado neste mês'}
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-xs font-medium',
                            d.ativa ? 'text-emerald-600' : 'text-slate-400',
                          )}
                        >
                          {d.ativa ? 'Ativa' : 'Pausada'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {d.credor || 'Sem credor'} · vence dia {d.diaVencimento}
                      </p>
                      {aindaNaoComecou && (
                        <p className="mt-1 text-xs text-amber-600">
                          Não aparece no resumo de {format(month, 'MMMM', { locale: ptBR })} — só a
                          partir de {format(inicio, 'MMMM yyyy', { locale: ptBR })}.
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                        <span>
                          Parcela{' '}
                          <strong className="tabular-nums text-slate-900">
                            {formatCurrency(d.parcelaMensal)}
                          </strong>
                        </span>
                        <span>
                          Restante{' '}
                          <strong className="tabular-nums text-slate-900">
                            {formatCurrency(restante)}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => updateDivida(d.id, { ativa: !d.ativa })}
                      >
                        {d.ativa ? 'Pausar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-red-500"
                        onClick={() => deleteDivida(d.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Calendário das parcelas
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {cronograma.map((c) => {
                        const isCurrent = monthKey(c.mes) === monthKey(month)
                        const isPast = c.mes < ref
                        return (
                          <div
                            key={c.numero}
                            className={cn(
                              'min-w-[4.5rem] shrink-0 rounded-xl px-2.5 py-2 text-center transition-shadow',
                              isCurrent
                                ? 'bg-slate-900 text-white shadow-md'
                                : isPast
                                  ? 'bg-slate-50 text-slate-400'
                                  : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-100',
                            )}
                          >
                            <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
                              {c.label}
                            </p>
                            <p className="mt-0.5 text-sm font-bold tabular-nums">
                              {c.numero}/{d.totalParcelas}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

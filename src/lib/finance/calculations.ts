import {
  addMonths,
  differenceInCalendarMonths,
  endOfMonth,
  format,
  isWithinInterval,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { parseLocalDate } from '@/lib/format'
import { salarioLiquido, type Categoria, type Divida, type Profile, type Transacao } from '@/types/finance'

export interface MonthlySummary {
  salariosLiquidos: number
  outrasReceitas: number
  receitas: number
  despesas: number
  parcelasDividas: number
  sobra: number
}

export function transacaoInMonth(transacao: Transacao, month: Date): boolean {
  const d = parseLocalDate(transacao.dataTransacao)
  return isWithinInterval(d, {
    start: startOfMonth(month),
    end: endOfMonth(month),
  })
}

/** Índice da parcela no mês (1..N) ou null se não cai neste mês */
export function numeroParcelaNoMes(divida: Divida, month: Date): number | null {
  if (!divida.ativa || divida.totalParcelas < 1 || !divida.dataInicio) return null
  const inicio = startOfMonth(parseLocalDate(divida.dataInicio))
  const alvo = startOfMonth(month)
  const idx = differenceInCalendarMonths(alvo, inicio) + 1
  if (idx < 1 || idx > divida.totalParcelas) return null
  return idx
}

export interface ParcelaDoMes {
  divida: Divida
  numero: number
  total: number
  valor: number
}

export function parcelasNoMes(dividas: Divida[], month: Date): ParcelaDoMes[] {
  return dividas
    .map((divida) => {
      const numero = numeroParcelaNoMes(divida, month)
      if (numero == null) return null
      return {
        divida,
        numero,
        total: divida.totalParcelas,
        valor: divida.parcelaMensal,
      }
    })
    .filter((p): p is ParcelaDoMes => p != null)
}

/** Data de vencimento da parcela no mês (ajusta dia 31 em meses menores) */
export function vencimentoNoMes(divida: Divida, month: Date): Date {
  const dia = Math.min(divida.diaVencimento, endOfMonth(month).getDate())
  return new Date(month.getFullYear(), month.getMonth(), dia)
}

/** Parcelamentos ativos que ainda não começaram no mês de referência */
export function parcelamentosFuturos(dividas: Divida[], month: Date): {
  divida: Divida
  inicioLabel: string
}[] {
  const ref = startOfMonth(month)
  return dividas
    .filter((d) => d.ativa && d.totalParcelas >= 1 && d.dataInicio)
    .filter((d) => startOfMonth(parseLocalDate(d.dataInicio)) > ref)
    .map((divida) => ({
      divida,
      inicioLabel: format(parseLocalDate(divida.dataInicio), 'MMM/yy', { locale: ptBR }),
    }))
    .sort(
      (a, b) =>
        parseLocalDate(a.divida.dataInicio).getTime() -
        parseLocalDate(b.divida.dataInicio).getTime(),
    )
}

/** Cronograma completo das parcelas (para calendário na tela de dívidas) */
export function cronogramaParcelas(divida: Divida): {
  numero: number
  mes: Date
  label: string
  vencimento: string
}[] {
  if (divida.totalParcelas < 1 || !divida.dataInicio) return []
  const inicio = startOfMonth(parseLocalDate(divida.dataInicio))
  return Array.from({ length: divida.totalParcelas }, (_, i) => {
    const mes = addMonths(inicio, i)
    const dia = Math.min(divida.diaVencimento, endOfMonth(mes).getDate())
    const venc = new Date(mes.getFullYear(), mes.getMonth(), dia)
    return {
      numero: i + 1,
      mes,
      label: format(mes, 'MMM/yy', { locale: ptBR }),
      vencimento: format(venc, 'dd/MM/yyyy'),
    }
  })
}

/** Saldo ainda a pagar a partir do mês de referência (inclui a parcela do mês) */
export function saldoRestante(divida: Divida, refMonth: Date = new Date()): number {
  const atual = numeroParcelaNoMes(divida, refMonth)
  if (atual == null) {
    const inicio = startOfMonth(parseLocalDate(divida.dataInicio))
    if (startOfMonth(refMonth) < inicio) {
      return divida.parcelaMensal * divida.totalParcelas
    }
    return 0
  }
  const restantes = divida.totalParcelas - atual + 1
  return Math.max(0, restantes * divida.parcelaMensal)
}

export function summarizeMonth(
  profiles: Profile[],
  transacoes: Transacao[],
  categorias: Categoria[],
  dividas: Divida[],
  month: Date,
): MonthlySummary {
  const catMap = new Map(categorias.map((c) => [c.id, c]))
  const salariosLiquidos = profiles.reduce((sum, p) => sum + salarioLiquido(p), 0)

  let outrasReceitas = 0
  let despesas = 0

  for (const t of transacoes) {
    if (!transacaoInMonth(t, month)) continue
    const cat = catMap.get(t.categoriaId)
    if (!cat) continue
    if (cat.tipo === 'receita') outrasReceitas += t.valor
    else despesas += t.valor
  }

  const parcelasDividas = parcelasNoMes(dividas, month).reduce((sum, p) => sum + p.valor, 0)
  const receitas = salariosLiquidos + outrasReceitas

  return {
    salariosLiquidos,
    outrasReceitas,
    receitas,
    despesas,
    parcelasDividas,
    sobra: receitas - despesas - parcelasDividas,
  }
}

export interface CategoryBreakdown {
  categoriaId: string
  nome: string
  total: number
}

export function despesasPorCategoria(
  transacoes: Transacao[],
  categorias: Categoria[],
  month: Date,
): CategoryBreakdown[] {
  const catMap = new Map(categorias.map((c) => [c.id, c]))
  const totals = new Map<string, number>()

  for (const t of transacoes) {
    if (!transacaoInMonth(t, month)) continue
    const cat = catMap.get(t.categoriaId)
    if (!cat || cat.tipo !== 'despesa') continue
    totals.set(cat.id, (totals.get(cat.id) ?? 0) + t.valor)
  }

  return [...totals.entries()]
    .map(([categoriaId, total]) => ({
      categoriaId,
      nome: catMap.get(categoriaId)?.nome ?? 'Outros',
      total,
    }))
    .sort((a, b) => b.total - a.total)
}

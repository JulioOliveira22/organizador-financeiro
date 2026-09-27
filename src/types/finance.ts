export type TipoCategoria = 'receita' | 'despesa'
export type StatusTransacao = 'pago' | 'pendente'

export interface Profile {
  id: string
  nome: string
  email: string
  /** Salário bruto mensal (CLT / estágio) */
  salarioBruto: number
  /** Soma dos descontos fixos (INSS, IRRF, etc.) */
  descontos: number
}

export function salarioLiquido(profile: Pick<Profile, 'salarioBruto' | 'descontos'>): number {
  return Math.max(0, (profile.salarioBruto || 0) - (profile.descontos || 0))
}

export interface Household {
  id: string
  nome: string
}

export interface Categoria {
  id: string
  householdId: string
  nome: string
  tipo: TipoCategoria
}

export interface Transacao {
  id: string
  householdId: string
  categoriaId: string
  criadoPor: string
  valor: number
  dataTransacao: string
  descricao: string
  status: StatusTransacao
  pagoPor: string
}

export interface Divida {
  id: string
  householdId: string
  nome: string
  credor: string
  /** Valor de cada parcela */
  parcelaMensal: number
  /** Quantidade total de parcelas (ex.: 6x) */
  totalParcelas: number
  /** Mês da 1ª parcela (YYYY-MM-01) — agenda as demais no calendário */
  dataInicio: string
  diaVencimento: number
  ativa: boolean
}

export type TransacaoInput = Omit<Transacao, 'id' | 'householdId'>
export type CategoriaInput = Omit<Categoria, 'id' | 'householdId'>
export type DividaInput = Omit<Divida, 'id' | 'householdId'>
export type ProfileInput = Pick<Profile, 'nome' | 'salarioBruto' | 'descontos'>

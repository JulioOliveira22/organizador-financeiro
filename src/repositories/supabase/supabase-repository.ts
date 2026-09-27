import type { FinanceRepository } from '@/repositories/finance-repository'
import { getSupabaseClient } from '@/repositories/supabase/client'
import type {
  Categoria,
  CategoriaInput,
  Divida,
  Household,
  Profile,
  Transacao,
} from '@/types/finance'

type DbCategoria = {
  id: string
  household_id: string
  nome: string
  tipo: 'receita' | 'despesa'
}

type DbTransacao = {
  id: string
  household_id: string
  categoria_id: string
  criado_por: string
  valor: number
  data_transacao: string
  descricao: string
  status: 'pago' | 'pendente'
  pago_por: string
}

type DbDivida = {
  id: string
  household_id: string
  nome: string
  credor: string
  parcela_mensal: number
  total_parcelas: number
  data_inicio: string
  dia_vencimento: number
  ativa: boolean
}

type DbProfile = {
  id: string
  nome: string
  salario_bruto: number | null
  descontos: number | null
}

function mapCategoria(row: DbCategoria): Categoria {
  return {
    id: row.id,
    householdId: row.household_id,
    nome: row.nome,
    tipo: row.tipo,
  }
}

function mapTransacao(row: DbTransacao): Transacao {
  return {
    id: row.id,
    householdId: row.household_id,
    categoriaId: row.categoria_id,
    criadoPor: row.criado_por,
    valor: Number(row.valor),
    dataTransacao: row.data_transacao,
    descricao: row.descricao,
    status: row.status,
    pagoPor: row.pago_por,
  }
}

function mapDivida(row: DbDivida): Divida {
  return {
    id: row.id,
    householdId: row.household_id,
    nome: row.nome,
    credor: row.credor,
    parcelaMensal: Number(row.parcela_mensal),
    totalParcelas: Number(row.total_parcelas ?? 1),
    dataInicio: row.data_inicio,
    diaVencimento: row.dia_vencimento,
    ativa: row.ativa,
  }
}

async function getPrimaryHousehold(): Promise<Household> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('households')
    .select('id, nome')
    .limit(1)
    .single()
  if (error || !data) throw new Error('Household não encontrado. Cadastre-se primeiro.')
  return { id: data.id, nome: data.nome }
}

async function profileFromAuth(): Promise<Profile> {
  const supabase = getSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão inválida.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nome, salario_bruto, descontos')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    nome: profile?.nome ?? user.email ?? 'Usuário',
    email: user.email ?? '',
    salarioBruto: Number(profile?.salario_bruto ?? 0),
    descontos: Number(profile?.descontos ?? 0),
  }
}

export function createSupabaseRepository(): FinanceRepository {
  return {
    async signIn(email, password) {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      const user = await profileFromAuth()
      const household = await getPrimaryHousehold()
      return { user, household }
    },

    async signUp(nome, email, password) {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome } },
      })
      if (error) throw new Error(error.message)
      const user = await profileFromAuth()
      const household = await getPrimaryHousehold()
      return { user, household }
    },

    async signOut() {
      await getSupabaseClient().auth.signOut()
    },

    async getSession() {
      const supabase = getSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return null
      try {
        const user = await profileFromAuth()
        const household = await getPrimaryHousehold()
        return { user, household }
      } catch {
        return null
      }
    },

    async listProfiles(householdId) {
      const supabase = getSupabaseClient()
      const { data: members, error: mErr } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', householdId)
      if (mErr) throw new Error(mErr.message)
      const ids = (members ?? []).map((m) => m.user_id)
      if (ids.length === 0) return []

      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, salario_bruto, descontos')
        .in('id', ids)
        .order('created_at')
      if (error) throw new Error(error.message)

      const { data: authData } = await supabase.auth.getUser()
      const email = authData.user?.email ?? ''

      return ((data ?? []) as DbProfile[]).map((p) => ({
        id: p.id,
        nome: p.nome,
        email: p.id === authData.user?.id ? email : '',
        salarioBruto: Number(p.salario_bruto ?? 0),
        descontos: Number(p.descontos ?? 0),
      }))
    },

    async updateProfile(id, input) {
      const payload: Record<string, unknown> = {}
      if (input.nome !== undefined) payload.nome = input.nome
      if (input.salarioBruto !== undefined) payload.salario_bruto = input.salarioBruto
      if (input.descontos !== undefined) payload.descontos = input.descontos

      const { data, error } = await getSupabaseClient()
        .from('profiles')
        .update(payload)
        .eq('id', id)
        .select('id, nome, salario_bruto, descontos')
        .single()
      if (error) throw new Error(error.message)

      const row = data as DbProfile
      return {
        id: row.id,
        nome: row.nome,
        email: '',
        salarioBruto: Number(row.salario_bruto ?? 0),
        descontos: Number(row.descontos ?? 0),
      }
    },

    async listCategorias(householdId) {
      const { data, error } = await getSupabaseClient()
        .from('categorias')
        .select('*')
        .eq('household_id', householdId)
        .order('nome')
      if (error) throw new Error(error.message)
      return (data as DbCategoria[]).map(mapCategoria)
    },

    async createCategoria(householdId, input) {
      const { data, error } = await getSupabaseClient()
        .from('categorias')
        .insert({
          household_id: householdId,
          nome: input.nome,
          tipo: input.tipo,
        })
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return mapCategoria(data as DbCategoria)
    },

    async updateCategoria(id, input) {
      const payload: Partial<CategoriaInput> = {}
      if (input.nome !== undefined) payload.nome = input.nome
      if (input.tipo !== undefined) payload.tipo = input.tipo
      const { data, error } = await getSupabaseClient()
        .from('categorias')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return mapCategoria(data as DbCategoria)
    },

    async deleteCategoria(id) {
      const { error } = await getSupabaseClient().from('categorias').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async listTransacoes(householdId) {
      const { data, error } = await getSupabaseClient()
        .from('transacoes')
        .select('*')
        .eq('household_id', householdId)
        .order('data_transacao', { ascending: false })
      if (error) throw new Error(error.message)
      return (data as DbTransacao[]).map(mapTransacao)
    },

    async createTransacao(householdId, input) {
      const { data, error } = await getSupabaseClient()
        .from('transacoes')
        .insert({
          household_id: householdId,
          categoria_id: input.categoriaId,
          criado_por: input.criadoPor,
          valor: input.valor,
          data_transacao: input.dataTransacao,
          descricao: input.descricao,
          status: input.status,
          pago_por: input.pagoPor,
        })
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return mapTransacao(data as DbTransacao)
    },

    async updateTransacao(id, input) {
      const payload: Record<string, unknown> = {}
      if (input.categoriaId !== undefined) payload.categoria_id = input.categoriaId
      if (input.criadoPor !== undefined) payload.criado_por = input.criadoPor
      if (input.valor !== undefined) payload.valor = input.valor
      if (input.dataTransacao !== undefined) payload.data_transacao = input.dataTransacao
      if (input.descricao !== undefined) payload.descricao = input.descricao
      if (input.status !== undefined) payload.status = input.status
      if (input.pagoPor !== undefined) payload.pago_por = input.pagoPor

      const { data, error } = await getSupabaseClient()
        .from('transacoes')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return mapTransacao(data as DbTransacao)
    },

    async deleteTransacao(id) {
      const { error } = await getSupabaseClient().from('transacoes').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    async listDividas(householdId) {
      const { data, error } = await getSupabaseClient()
        .from('dividas')
        .select('*')
        .eq('household_id', householdId)
        .order('nome')
      if (error) throw new Error(error.message)
      return (data as DbDivida[]).map(mapDivida)
    },

    async createDivida(householdId, input) {
      const { data, error } = await getSupabaseClient()
        .from('dividas')
        .insert({
          household_id: householdId,
          nome: input.nome,
          credor: input.credor,
          parcela_mensal: input.parcelaMensal,
          total_parcelas: input.totalParcelas,
          data_inicio: input.dataInicio,
          dia_vencimento: input.diaVencimento,
          ativa: input.ativa,
        })
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return mapDivida(data as DbDivida)
    },

    async updateDivida(id, input) {
      const payload: Record<string, unknown> = {}
      if (input.nome !== undefined) payload.nome = input.nome
      if (input.credor !== undefined) payload.credor = input.credor
      if (input.parcelaMensal !== undefined) payload.parcela_mensal = input.parcelaMensal
      if (input.totalParcelas !== undefined) payload.total_parcelas = input.totalParcelas
      if (input.dataInicio !== undefined) payload.data_inicio = input.dataInicio
      if (input.diaVencimento !== undefined) payload.dia_vencimento = input.diaVencimento
      if (input.ativa !== undefined) payload.ativa = input.ativa

      const { data, error } = await getSupabaseClient()
        .from('dividas')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return mapDivida(data as DbDivida)
    },

    async deleteDivida(id) {
      const { error } = await getSupabaseClient().from('dividas').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
  }
}

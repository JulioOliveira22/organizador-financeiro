import { create } from 'zustand'
import { startOfMonth } from 'date-fns'

import {
  createFinanceRepository,
  getDataSource,
  type FinanceRepository,
} from '@/repositories'
import type {
  Categoria,
  CategoriaInput,
  Divida,
  DividaInput,
  Household,
  Profile,
  ProfileInput,
  Transacao,
  TransacaoInput,
} from '@/types/finance'

interface AppState {
  dataSource: ReturnType<typeof getDataSource>
  repo: FinanceRepository
  loading: boolean
  error: string | null
  user: Profile | null
  household: Household | null
  profiles: Profile[]
  categorias: Categoria[]
  transacoes: Transacao[]
  dividas: Divida[]
  month: Date

  initSession: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (nome: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setMonth: (month: Date) => void
  refreshAll: () => Promise<void>

  updateProfile: (id: string, input: Partial<ProfileInput>) => Promise<void>
  createCategoria: (input: CategoriaInput) => Promise<void>
  updateCategoria: (id: string, input: Partial<CategoriaInput>) => Promise<void>
  deleteCategoria: (id: string) => Promise<void>
  createTransacao: (input: TransacaoInput) => Promise<void>
  updateTransacao: (id: string, input: Partial<TransacaoInput>) => Promise<void>
  deleteTransacao: (id: string) => Promise<void>
  createDivida: (input: DividaInput) => Promise<void>
  deleteDivida: (id: string) => Promise<void>
  updateDivida: (id: string, input: Partial<DividaInput>) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  dataSource: getDataSource(),
  repo: createFinanceRepository(),
  loading: true,
  error: null,
  user: null,
  household: null,
  profiles: [],
  categorias: [],
  transacoes: [],
  dividas: [],
  month: startOfMonth(new Date()),

  async initSession() {
    set({ loading: true, error: null })
    try {
      const session = await get().repo.getSession()
      if (!session) {
        set({ user: null, household: null, loading: false })
        return
      }
      set({ user: session.user, household: session.household })
      await get().refreshAll()
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Erro ao carregar sessão.',
        loading: false,
      })
    }
  },

  async signIn(email, password) {
    set({ loading: true, error: null })
    try {
      const session = await get().repo.signIn(email, password)
      set({ user: session.user, household: session.household })
      await get().refreshAll()
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Falha no login.',
      })
      throw e
    }
  },

  async signUp(nome, email, password) {
    set({ loading: true, error: null })
    try {
      const session = await get().repo.signUp(nome, email, password)
      set({ user: session.user, household: session.household })
      await get().refreshAll()
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Falha no cadastro.',
      })
      throw e
    }
  },

  async signOut() {
    await get().repo.signOut()
    set({
      user: null,
      household: null,
      profiles: [],
      categorias: [],
      transacoes: [],
      dividas: [],
      loading: false,
    })
  },

  setMonth(month) {
    set({ month: startOfMonth(month) })
  },

  async refreshAll() {
    const { household, repo } = get()
    if (!household) {
      set({ loading: false })
      return
    }
    set({ loading: true, error: null })
    try {
      const [profiles, categorias, transacoes, dividas] = await Promise.all([
        repo.listProfiles(household.id),
        repo.listCategorias(household.id),
        repo.listTransacoes(household.id),
        repo.listDividas(household.id),
      ])
      set({ profiles, categorias, transacoes, dividas, loading: false })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Erro ao carregar dados.',
      })
    }
  },

  async createCategoria(input) {
    const { household, repo } = get()
    if (!household) return
    await repo.createCategoria(household.id, input)
    await get().refreshAll()
  },

  async updateProfile(id, input) {
    await get().repo.updateProfile(id, input)
    await get().refreshAll()
  },

  async updateCategoria(id, input) {
    await get().repo.updateCategoria(id, input)
    await get().refreshAll()
  },

  async deleteCategoria(id) {
    await get().repo.deleteCategoria(id)
    await get().refreshAll()
  },

  async createTransacao(input) {
    const { household, repo } = get()
    if (!household) return
    await repo.createTransacao(household.id, input)
    await get().refreshAll()
  },

  async updateTransacao(id, input) {
    await get().repo.updateTransacao(id, input)
    await get().refreshAll()
  },

  async deleteTransacao(id) {
    await get().repo.deleteTransacao(id)
    await get().refreshAll()
  },

  async createDivida(input) {
    const { household, repo } = get()
    if (!household) return
    await repo.createDivida(household.id, input)
    await get().refreshAll()
  },

  async deleteDivida(id) {
    await get().repo.deleteDivida(id)
    await get().refreshAll()
  },

  async updateDivida(id, input) {
    await get().repo.updateDivida(id, input)
    await get().refreshAll()
  },
}))

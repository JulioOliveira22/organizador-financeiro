import type { FinanceRepository } from '@/repositories/finance-repository'
import {
  createInitialMockDb,
  MOCK_HOUSEHOLD_ID,
  type MockDb,
} from '@/repositories/mock/mock-seed'
import type { Categoria, Divida, Profile, Transacao } from '@/types/finance'

const STORAGE_KEY = 'organizador-financeiro-mock-v8'
const SESSION_KEY = 'organizador-financeiro-session'

function uid(): string {
  return crypto.randomUUID()
}

function normalizeProfile(p: Profile & { salarioMensal?: number }): Profile {
  // Migração leve de seed antigo
  if (p.salarioBruto === undefined && p.salarioMensal !== undefined) {
    return {
      id: p.id,
      nome: p.nome,
      email: p.email,
      salarioBruto: p.salarioMensal,
      descontos: p.descontos ?? 0,
    }
  }
  return {
    id: p.id,
    nome: p.nome,
    email: p.email,
    salarioBruto: p.salarioBruto ?? 0,
    descontos: p.descontos ?? 0,
  }
}

function loadDb(): MockDb {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const db = JSON.parse(raw) as MockDb
      db.profiles = db.profiles.map(normalizeProfile)
      return db
    } catch {
      /* reset */
    }
  }
  const initial = createInitialMockDb()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
  return initial
}

function saveDb(db: MockDb): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

function getSessionUserId(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

function setSessionUserId(userId: string | null): void {
  if (userId) localStorage.setItem(SESSION_KEY, userId)
  else localStorage.removeItem(SESSION_KEY)
}

export function createMockRepository(): FinanceRepository {
  return {
    async signIn(email, password) {
      const db = loadDb()
      const normalized = email.trim().toLowerCase()
      if (db.credentials[normalized] !== password) {
        throw new Error('E-mail ou senha inválidos.')
      }
      const user = db.profiles.find((p) => p.email === normalized)
      if (!user) throw new Error('Usuário não encontrado.')
      setSessionUserId(user.id)
      return { user: normalizeProfile(user), household: db.household }
    },

    async signUp(nome, email, password) {
      const db = loadDb()
      const normalized = email.trim().toLowerCase()
      if (db.credentials[normalized]) {
        throw new Error('Este e-mail já está cadastrado.')
      }
      const user: Profile = {
        id: uid(),
        nome,
        email: normalized,
        salarioBruto: 0,
        descontos: 0,
      }
      db.profiles.push(user)
      db.credentials[normalized] = password
      saveDb(db)
      setSessionUserId(user.id)
      return { user, household: db.household }
    },

    async signOut() {
      setSessionUserId(null)
    },

    async getSession() {
      const userId = getSessionUserId()
      if (!userId) return null
      const db = loadDb()
      const user = db.profiles.find((p) => p.id === userId)
      if (!user) return null
      return { user: normalizeProfile(user), household: db.household }
    },

    async listProfiles(householdId) {
      const db = loadDb()
      if (householdId !== MOCK_HOUSEHOLD_ID) return []
      return db.profiles.map(normalizeProfile)
    },

    async updateProfile(id, input) {
      const db = loadDb()
      const idx = db.profiles.findIndex((p) => p.id === id)
      if (idx < 0) throw new Error('Perfil não encontrado.')
      db.profiles[idx] = normalizeProfile({ ...db.profiles[idx], ...input })
      saveDb(db)
      return db.profiles[idx]
    },

    async listCategorias(householdId) {
      const db = loadDb()
      return db.categorias.filter((c) => c.householdId === householdId)
    },

    async createCategoria(householdId, input) {
      const db = loadDb()
      const cat: Categoria = { id: uid(), householdId, ...input }
      db.categorias.push(cat)
      saveDb(db)
      return cat
    },

    async updateCategoria(id, input) {
      const db = loadDb()
      const idx = db.categorias.findIndex((c) => c.id === id)
      if (idx < 0) throw new Error('Categoria não encontrada.')
      db.categorias[idx] = { ...db.categorias[idx], ...input }
      saveDb(db)
      return db.categorias[idx]
    },

    async deleteCategoria(id) {
      const db = loadDb()
      db.categorias = db.categorias.filter((c) => c.id !== id)
      db.transacoes = db.transacoes.filter((t) => t.categoriaId !== id)
      saveDb(db)
    },

    async listTransacoes(householdId) {
      const db = loadDb()
      return db.transacoes
        .filter((t) => t.householdId === householdId)
        .sort((a, b) => b.dataTransacao.localeCompare(a.dataTransacao))
    },

    async createTransacao(householdId, input) {
      const db = loadDb()
      const tx: Transacao = { id: uid(), householdId, ...input }
      db.transacoes.push(tx)
      saveDb(db)
      return tx
    },

    async updateTransacao(id, input) {
      const db = loadDb()
      const idx = db.transacoes.findIndex((t) => t.id === id)
      if (idx < 0) throw new Error('Transação não encontrada.')
      db.transacoes[idx] = { ...db.transacoes[idx], ...input }
      saveDb(db)
      return db.transacoes[idx]
    },

    async deleteTransacao(id) {
      const db = loadDb()
      db.transacoes = db.transacoes.filter((t) => t.id !== id)
      saveDb(db)
    },

    async listDividas(householdId) {
      const db = loadDb()
      return db.dividas.filter((d) => d.householdId === householdId)
    },

    async createDivida(householdId, input) {
      const db = loadDb()
      const div: Divida = { id: uid(), householdId, ...input }
      db.dividas.push(div)
      saveDb(db)
      return div
    },

    async updateDivida(id, input) {
      const db = loadDb()
      const idx = db.dividas.findIndex((d) => d.id === id)
      if (idx < 0) throw new Error('Dívida não encontrada.')
      db.dividas[idx] = { ...db.dividas[idx], ...input }
      saveDb(db)
      return db.dividas[idx]
    },

    async deleteDivida(id) {
      const db = loadDb()
      db.dividas = db.dividas.filter((d) => d.id !== id)
      saveDb(db)
    },
  }
}

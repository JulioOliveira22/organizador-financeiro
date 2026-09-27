import { createMockRepository } from '@/repositories/mock/mock-repository'
import { createSupabaseRepository } from '@/repositories/supabase/supabase-repository'
import type { FinanceRepository } from '@/repositories/finance-repository'
import { isSupabaseConfigured } from '@/repositories/supabase/client'

export type DataSource = 'mock' | 'supabase'

export function getDataSource(): DataSource {
  const env = import.meta.env.VITE_DATA_SOURCE as DataSource | undefined
  if (env === 'supabase' && isSupabaseConfigured()) return 'supabase'
  if (env === 'mock') return 'mock'
  return isSupabaseConfigured() ? 'supabase' : 'mock'
}

export function createFinanceRepository(): FinanceRepository {
  return getDataSource() === 'supabase'
    ? createSupabaseRepository()
    : createMockRepository()
}

export type { FinanceRepository } from '@/repositories/finance-repository'

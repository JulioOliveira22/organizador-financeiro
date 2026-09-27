import type { Profile } from '@/types/finance'

/** Primeiro perfil = azul; segundo = rosa */
export function partnerRole(profiles: Profile[], profileId: string): 'him' | 'her' {
  const idx = profiles.findIndex((p) => p.id === profileId)
  return idx <= 0 ? 'him' : 'her'
}

export const partnerTheme = {
  him: {
    avatar:
      'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-200/80',
    tag: 'bg-blue-100 text-blue-800 font-semibold',
    card:
      'border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm shadow-blue-500/10 hover:shadow-md hover:shadow-blue-500/15',
    editBtn: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-0',
    dot: 'bg-blue-600',
    text: 'text-blue-600',
  },
  her: {
    avatar:
      'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-lg shadow-rose-500/40 ring-2 ring-rose-200/80',
    tag: 'bg-rose-100 text-rose-800 font-semibold',
    card:
      'border border-rose-200 bg-gradient-to-br from-rose-50 to-white shadow-sm shadow-rose-500/10 hover:shadow-md hover:shadow-rose-500/15',
    editBtn: 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-0',
    dot: 'bg-rose-500',
    text: 'text-rose-500',
  },
} as const

export function initials(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/** Cores vibrantes alinhadas ao casal (azul / rosa) + acentos */
export const CHART_PREMIUM = [
  '#2563eb', // blue-600
  '#f43f5e', // rose-500
  '#0ea5e9', // sky-500
  '#e11d48', // rose-600
  '#3b82f6', // blue-500
  '#fb7185', // rose-400
]

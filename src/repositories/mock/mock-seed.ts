import type {
  Categoria,
  Divida,
  Household,
  Profile,
  Transacao,
} from '@/types/finance'

export const MOCK_HOUSEHOLD_ID = '00000000-0000-4000-8000-000000000001'
export const MOCK_USER_A = '00000000-0000-4000-8000-00000000000a'
export const MOCK_USER_B = '00000000-0000-4000-8000-00000000000b'

export const MOCK_PASSWORD = '123456'

export interface MockDb {
  household: Household
  profiles: Profile[]
  categorias: Categoria[]
  transacoes: Transacao[]
  dividas: Divida[]
  credentials: Record<string, string>
}

function tx(
  partial: Omit<Transacao, 'householdId'> & { householdId?: string },
): Transacao {
  return { householdId: MOCK_HOUSEHOLD_ID, ...partial }
}

export function createInitialMockDb(): MockDb {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')

  return {
    household: { id: MOCK_HOUSEHOLD_ID, nome: 'Nós dois' },
    profiles: [
      {
        id: MOCK_USER_A,
        nome: 'Lucas',
        email: 'lucas@demo.dev',
        salarioBruto: 3500,
        descontos: 420,
      },
      {
        id: MOCK_USER_B,
        nome: 'Marina',
        email: 'marina@demo.dev',
        salarioBruto: 3200,
        descontos: 380,
      },
    ],
    credentials: {
      'lucas@demo.dev': MOCK_PASSWORD,
      'marina@demo.dev': MOCK_PASSWORD,
    },
    categorias: [
      {
        id: 'cat-extra',
        householdId: MOCK_HOUSEHOLD_ID,
        nome: 'Renda extra',
        tipo: 'receita',
      },
      {
        id: 'cat-mercado',
        householdId: MOCK_HOUSEHOLD_ID,
        nome: 'Mercado',
        tipo: 'despesa',
      },
      {
        id: 'cat-aluguel',
        householdId: MOCK_HOUSEHOLD_ID,
        nome: 'Aluguel',
        tipo: 'despesa',
      },
      {
        id: 'cat-lazer',
        householdId: MOCK_HOUSEHOLD_ID,
        nome: 'Lazer',
        tipo: 'despesa',
      },
      {
        id: 'cat-transporte',
        householdId: MOCK_HOUSEHOLD_ID,
        nome: 'Transporte',
        tipo: 'despesa',
      },
    ],
    transacoes: [
      tx({
        id: 'tx-3',
        categoriaId: 'cat-aluguel',
        criadoPor: MOCK_USER_A,
        valor: 900,
        dataTransacao: `${y}-${m}-10`,
        descricao: 'Aluguel',
        status: 'pago',
        pagoPor: MOCK_USER_A,
      }),
      tx({
        id: 'tx-4',
        categoriaId: 'cat-mercado',
        criadoPor: MOCK_USER_B,
        valor: 380,
        dataTransacao: `${y}-${m}-12`,
        descricao: 'Mercado',
        status: 'pago',
        pagoPor: MOCK_USER_B,
      }),
    ],
    dividas: [
      {
        id: 'div-1',
        householdId: MOCK_HOUSEHOLD_ID,
        nome: 'Cartão',
        credor: 'Banco',
        parcelaMensal: 200,
        totalParcelas: 6,
        dataInicio: `${y}-${m}-01`,
        diaVencimento: 15,
        ativa: true,
      },
    ],
  }
}

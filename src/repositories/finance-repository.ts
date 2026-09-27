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

export interface AuthResult {
  user: Profile
  household: Household
}

export interface FinanceRepository {
  signIn(email: string, password: string): Promise<AuthResult>
  signUp(nome: string, email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  getSession(): Promise<AuthResult | null>

  listProfiles(householdId: string): Promise<Profile[]>
  updateProfile(id: string, input: Partial<ProfileInput>): Promise<Profile>

  listCategorias(householdId: string): Promise<Categoria[]>
  createCategoria(householdId: string, input: CategoriaInput): Promise<Categoria>
  updateCategoria(id: string, input: Partial<CategoriaInput>): Promise<Categoria>
  deleteCategoria(id: string): Promise<void>

  listTransacoes(householdId: string): Promise<Transacao[]>
  createTransacao(householdId: string, input: TransacaoInput): Promise<Transacao>
  updateTransacao(id: string, input: Partial<TransacaoInput>): Promise<Transacao>
  deleteTransacao(id: string): Promise<void>

  listDividas(householdId: string): Promise<Divida[]>
  createDivida(householdId: string, input: DividaInput): Promise<Divida>
  updateDivida(id: string, input: Partial<DividaInput>): Promise<Divida>
  deleteDivida(id: string): Promise<void>
}

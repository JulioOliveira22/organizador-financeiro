import { useMemo, useState } from 'react'
import { format, startOfMonth } from 'date-fns'

import { MonthPicker } from '@/components/shared/MonthPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { transacaoInMonth } from '@/lib/finance/calculations'
import { formatCurrency, parseLocalDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
import type { StatusTransacao, Transacao } from '@/types/finance'

const selectClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500'

type FormState = {
  categoriaId: string
  valor: string
  dataTransacao: string
  descricao: string
  status: StatusTransacao
}

function emptyForm(month: Date): FormState {
  const today = new Date()
  const sameMonth =
    today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth()
  return {
    categoriaId: '',
    valor: '',
    dataTransacao: format(sameMonth ? today : startOfMonth(month), 'yyyy-MM-dd'),
    descricao: '',
    status: 'pago',
  }
}

export function TransacoesPage() {
  const month = useAppStore((s) => s.month)
  const user = useAppStore((s) => s.user)
  const categorias = useAppStore((s) => s.categorias)
  const transacoes = useAppStore((s) => s.transacoes)
  const createTransacao = useAppStore((s) => s.createTransacao)
  const updateTransacao = useAppStore((s) => s.updateTransacao)
  const deleteTransacao = useAppStore((s) => s.deleteTransacao)

  const [form, setForm] = useState<FormState>(() => emptyForm(month))
  const [editing, setEditing] = useState<Transacao | null>(null)

  const filtered = useMemo(
    () => transacoes.filter((t) => transacaoInMonth(t, month)),
    [transacoes, month],
  )

  const catMap = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.categoriaId) return
    const payload = {
      categoriaId: form.categoriaId,
      criadoPor: user.id,
      valor: Number(form.valor),
      dataTransacao: form.dataTransacao,
      descricao: form.descricao,
      status: form.status,
      pagoPor: user.id,
    }
    if (editing) {
      await updateTransacao(editing.id, payload)
      setEditing(null)
    } else {
      await createTransacao(payload)
    }
    setForm(emptyForm(month))
  }

  function startEdit(t: Transacao) {
    setEditing(t)
    setForm({
      categoriaId: t.categoriaId,
      valor: String(t.valor),
      dataTransacao: t.dataTransacao,
      descricao: t.descricao,
      status: t.status,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Lançamentos</h1>
          <p className="text-sm text-slate-500">Gastos e extras do mês</p>
        </div>
        <MonthPicker />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? 'Editar lançamento' : 'Novo lançamento'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cat">Categoria</Label>
              <select
                id="cat"
                className={selectClass}
                value={form.categoriaId}
                onChange={(e) => setField('categoriaId', e.target.value)}
                required
              >
                <option value="">Selecione…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.tipo})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(e) => setField('valor', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={form.dataTransacao}
                onChange={(e) => setField('dataTransacao', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="desc">Descrição</Label>
              <Input
                id="desc"
                value={form.descricao}
                onChange={(e) => setField('descricao', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className={selectClass}
                value={form.status}
                onChange={(e) => setField('status', e.target.value as StatusTransacao)}
              >
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="rounded-xl">
                {editing ? 'Salvar' : 'Adicionar'}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setEditing(null)
                    setForm(emptyForm(month))
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <CardContent className="p-5 text-sm text-slate-500">
            Nenhum lançamento neste mês.
          </CardContent>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((t) => {
              const cat = catMap.get(t.categoriaId)
              const isReceita = cat?.tipo === 'receita'
              return (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {t.descricao || cat?.nome || 'Lançamento'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(parseLocalDate(t.dataTransacao), 'dd/MM/yyyy')}
                      {cat ? ` · ${cat.nome}` : ''}
                      {t.status === 'pendente' ? ' · pendente' : ''}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      isReceita ? 'text-emerald-600' : 'text-slate-900',
                    )}
                  >
                    {isReceita ? '+' : '−'}
                    {formatCurrency(t.valor)}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-lg text-xs"
                      onClick={() => startEdit(t)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-lg text-xs text-red-500"
                      onClick={() => deleteTransacao(t.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

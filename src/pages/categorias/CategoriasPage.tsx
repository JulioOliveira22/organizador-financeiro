import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
import type { TipoCategoria } from '@/types/finance'

const selectClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500'

export function CategoriasPage() {
  const categorias = useAppStore((s) => s.categorias)
  const createCategoria = useAppStore((s) => s.createCategoria)
  const deleteCategoria = useAppStore((s) => s.deleteCategoria)

  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoCategoria>('despesa')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    await createCategoria({ nome: nome.trim(), tipo })
    setNome('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Categorias</h1>
        <p className="text-sm text-slate-500">Organize receitas e despesas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit}>
            <div className="flex-1 space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Farmácia"
                required
              />
            </div>
            <div className="w-full space-y-2 sm:w-40">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                className={selectClass}
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoCategoria)}
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </div>
            <Button type="submit" className="rounded-xl">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <ul className="divide-y divide-slate-100">
          {categorias.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-slate-800">{c.nome}</p>
                <p
                  className={cn(
                    'text-xs font-medium',
                    c.tipo === 'receita' ? 'text-emerald-600' : 'text-slate-500',
                  )}
                >
                  {c.tipo === 'receita' ? 'Receita' : 'Despesa'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-xs text-red-500"
                onClick={() => deleteCategoria(c.id)}
              >
                Excluir
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

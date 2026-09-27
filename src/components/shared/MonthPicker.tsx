import { addMonths, format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'

export function MonthPicker() {
  const month = useAppStore((s) => s.month)
  const setMonth = useAppStore((s) => s.setMonth)

  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-white p-0.5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-lg"
        onClick={() => setMonth(startOfMonth(subMonths(month, 1)))}
        aria-label="Mês anterior"
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium capitalize text-slate-700">
        {format(month, 'MMMM yyyy', { locale: ptBR })}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-lg"
        onClick={() => setMonth(startOfMonth(addMonths(month, 1)))}
        aria-label="Próximo mês"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

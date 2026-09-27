import { Navigate, Outlet } from 'react-router-dom'

import { useAppStore } from '@/stores/app-store'

export function ProtectedRoute() {
  const user = useAppStore((s) => s.user)
  const loading = useAppStore((s) => s.loading)

  if (loading) {
    return (
      <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
        Carregando…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

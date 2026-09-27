import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { CategoriasPage } from '@/pages/categorias/CategoriasPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { DividasPage } from '@/pages/dividas/DividasPage'
import { TransacoesPage } from '@/pages/transacoes/TransacoesPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="transacoes" element={<TransacoesPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="dividas" element={<DividasPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

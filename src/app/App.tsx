import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { AppRouter } from '@/app/router'
import { getDataSource } from '@/repositories'
import { getSupabaseClient } from '@/repositories/supabase/client'
import { useAppStore } from '@/stores/app-store'

function AppBootstrap() {
  const initSession = useAppStore((s) => s.initSession)

  useEffect(() => {
    void initSession()
  }, [initSession])

  useEffect(() => {
    if (getDataSource() !== 'supabase') return
    const {
      data: { subscription },
    } = getSupabaseClient().auth.onAuthStateChange(() => {
      void initSession()
    })
    return () => subscription.unsubscribe()
  }, [initSession])

  return <AppRouter />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppBootstrap />
    </BrowserRouter>
  )
}

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/stores/app-store'

export function LoginPage() {
  const user = useAppStore((s) => s.user)
  const loading = useAppStore((s) => s.loading)
  const signIn = useAppStore((s) => s.signIn)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    function onMove(e: PointerEvent) {
      setPointer({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  if (user) return <Navigate to="/" replace />

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no login.')
    }
  }

  const px = (pointer.x - 0.5) * 2
  const py = (pointer.y - 0.5) * 2

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      {/* Glow que segue o cursor */}
      <div
        className="pointer-events-none absolute size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/25 blur-3xl transition-transform duration-300 ease-out"
        style={{
          left: `${pointer.x * 100}%`,
          top: `${pointer.y * 100}%`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/15 blur-3xl transition-transform duration-500 ease-out"
        style={{
          left: `${(1 - pointer.x) * 100}%`,
          top: `${(1 - pointer.y) * 100}%`,
        }}
        aria-hidden
      />

      {/* Formas com parallax */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-[2.5rem] bg-gradient-to-br from-sky-500 to-blue-700 opacity-90 transition-transform duration-300 ease-out"
        style={{ transform: `translate(${px * 28}px, ${py * 20}px) rotate(12deg)` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 top-16 size-56 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 opacity-80 transition-transform duration-500 ease-out"
        style={{ transform: `translate(${px * -36}px, ${py * 24}px)` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/4 size-64 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-sky-400 opacity-70 transition-transform duration-300 ease-out"
        style={{ transform: `translate(${px * 22}px, ${py * -30}px) rotate(-6deg)` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-24 right-[12%] size-36 rounded-3xl bg-sky-300/40 transition-transform duration-300 ease-out"
        style={{ transform: `translate(${px * -18}px, ${py * -14}px) rotate(12deg)` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[8%] top-1/3 size-24 rounded-full border-4 border-sky-400/40 transition-transform duration-500 ease-out"
        style={{ transform: `translate(${px * 40}px, ${py * -22}px)` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[20%] top-[18%] size-16 rounded-2xl bg-white/10 transition-transform duration-300 ease-out"
        style={{ transform: `translate(${px * -26}px, ${py * 32}px) rotate(45deg)` }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.55)_100%)]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 text-center sm:mb-10">
          <span className="mx-auto mb-4 block h-1 w-12 rounded-full bg-gradient-to-r from-sky-400 to-blue-500" />
          <h1 className="text-3xl font-semibold leading-snug tracking-tight text-white sm:text-4xl">
            Organizador
            <br />
            <span className="text-sky-300">de Finanças</span>
          </h1>
        </div>

        <form
          className="space-y-5 rounded-3xl border border-white/15 bg-white p-7 shadow-2xl shadow-black/40 sm:p-8"
          onSubmit={handleLogin}
        >
          {error && (
            <p
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="font-semibold text-slate-700">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-semibold text-slate-700">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800"
            disabled={loading}
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  )
}

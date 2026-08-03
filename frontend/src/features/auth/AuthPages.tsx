import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/features/auth/authStore'
import { ApiError } from '@/shared/lib/api'
import { useT } from '@/shared/i18n'
import { GlassCard } from '@/shared/components/ui'

export function LoginPage() {
  const t = useT()
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success(t('auth.welcome'))
      navigate(from)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('auth.badCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-mesh mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <GlassCard>
        <h1 className="font-display text-2xl font-bold">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('auth.loginSub')}</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            {t('auth.email')}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </label>
          <label className="block text-sm font-medium">
            {t('auth.password')}
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? t('auth.submittingLogin') : t('auth.submitLogin')}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            {t('auth.registerLink')}
          </Link>
        </p>
      </GlassCard>
    </div>
  )
}

export function RegisterPage() {
  const t = useT()
  const register = useAuthStore((s) => s.register)
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', password: '', display_name: '' })
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success(t('auth.accountCreated'))
      navigate('/dashboard')
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof TypeError
            ? t('auth.serverDown')
            : t('auth.registerFail')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-mesh mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <GlassCard>
        <h1 className="font-display text-2xl font-bold">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('auth.registerSub')}</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {(['display_name', 'username', 'email', 'password'] as const).map((field) => (
            <label key={field} className="block text-sm font-medium capitalize">
              {field === 'display_name'
                ? t('auth.name')
                : field === 'password'
                  ? t('auth.password')
                  : field === 'username'
                    ? t('auth.username')
                    : t('auth.email')}
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                required
                minLength={field === 'password' ? 12 : undefined}
                autoComplete={field === 'password' ? 'new-password' : undefined}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="input-field"
              />
            </label>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {t('auth.createAccount')}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            {t('auth.loginLink')}
          </Link>
        </p>
      </GlassCard>
    </div>
  )
}

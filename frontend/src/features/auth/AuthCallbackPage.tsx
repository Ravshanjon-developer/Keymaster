import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import toast from 'react-hot-toast'
import type { EmailOtpType } from '@supabase/supabase-js'

import { supabase } from '@/shared/lib/supabase'
import { useT } from '@/shared/i18n'
import { useAuthStore } from '@/features/auth/authStore'
import { GlassCard, Skeleton } from '@/shared/components/ui'

async function finishSupabaseCallback(): Promise<string | null> {
  if (!supabase) return null

  const search = new URLSearchParams(window.location.search)
  const code = search.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
  }

  const token_hash = search.get('token_hash')
  const type = search.get('type') as EmailOtpType | null
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) throw error
  }

  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session?.access_token ?? null
}

export function AuthCallbackPage() {
  const t = useT()
  const navigate = useNavigate()
  const initAuth = useAuthStore((s) => s.initAuth)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!supabase) {
        navigate('/login', { replace: true })
        return
      }
      try {
        const accessToken = await finishSupabaseCallback()
        if (cancelled) return
        if (accessToken) {
          localStorage.setItem('km_token', accessToken)
          useAuthStore.setState({ token: accessToken })
        }
        await initAuth()
        await refreshUser().catch(() => {})
        if (cancelled) return

        const { token, user } = useAuthStore.getState()
        if (token && user) {
          toast.success(t('auth.welcome'))
          navigate('/dashboard', { replace: true })
          return
        }
        if (token) {
          await refreshUser().catch(() => {})
          if (useAuthStore.getState().user) {
            toast.success(t('auth.welcome'))
            navigate('/dashboard', { replace: true })
            return
          }
        }
        toast.success(t('auth.verifySuccess'))
        navigate('/login?verified=1', { replace: true })
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : t('auth.verifyFail')
        setError(message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initAuth, navigate, refreshUser, t])

  return (
    <div className="page-mesh mx-auto max-w-md px-4 py-16">
      <GlassCard className="text-center">
        <h1 className="font-display text-xl font-bold">{t('auth.verifyTitle')}</h1>
        {!error && <Skeleton className="mx-auto mt-6 h-10 w-48" />}
        {error && (
          <>
            <p className="mt-4 text-signal">{error}</p>
            <Link to="/login" className="btn-primary mt-6 inline-flex min-h-11 px-6">
              {t('auth.loginLink')}
            </Link>
          </>
        )}
      </GlassCard>
    </div>
  )
}

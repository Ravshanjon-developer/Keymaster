import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { supabase } from '@/shared/lib/supabase'
import { useT } from '@/shared/i18n'
import { useAuthStore } from '@/features/auth/authStore'
import { GlassCard, Skeleton } from '@/shared/components/ui'

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
      const { error: authError } = await supabase.auth.getSession()
      if (cancelled) return
      if (authError) {
        setError(authError.message)
        return
      }
      await initAuth()
      await refreshUser().catch(() => {})
      navigate('/login?verified=1', { replace: true })
    })()
    return () => {
      cancelled = true
    }
  }, [initAuth, navigate, refreshUser])

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

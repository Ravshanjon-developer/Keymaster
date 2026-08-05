import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { api, ApiError } from '@/shared/lib/api'
import { useT } from '@/shared/i18n'
import { GlassCard } from '@/shared/components/ui'

export function VerifyEmailPage() {
  const t = useT()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage(t('auth.verifyMissingToken'))
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.verifyEmail(token)
        if (!cancelled) {
          setState('ok')
          setMessage(res.message)
          toast.success(t('auth.verifySuccess'))
        }
      } catch (err) {
        if (!cancelled) {
          setState('error')
          setMessage(err instanceof ApiError ? err.message : t('auth.verifyFail'))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, t])

  return (
    <div className="page-mesh mx-auto max-w-md px-4 py-16 pb-28 lg:pb-10">
      <GlassCard className="text-center">
        <h1 className="font-display text-2xl font-bold">{t('auth.verifyTitle')}</h1>
        {state === 'loading' && <p className="text-muted mt-4">{t('auth.verifyLoading')}</p>}
        {state === 'ok' && (
          <>
            <p className="mt-4 text-success-700 dark:text-success-400">{message}</p>
            <Link to="/login?verified=1" className="btn-primary mt-8 inline-flex min-h-11 px-8">
              {t('auth.loginLink')}
            </Link>
          </>
        )}
        {state === 'error' && (
          <>
            <p className="mt-4 text-signal" role="alert">
              {message}
            </p>
            <Link to="/register" className="btn-secondary mt-6 inline-flex min-h-11 px-6">
              {t('auth.registerLink')}
            </Link>
          </>
        )}
      </GlassCard>
    </div>
  )
}

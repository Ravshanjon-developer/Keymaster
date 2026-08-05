import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/features/auth/authStore'
import { api, ApiError } from '@/shared/lib/api'
import { isSupabaseAuth, supabase } from '@/shared/lib/supabase'
import { useT } from '@/shared/i18n'
import { GlassCard } from '@/shared/components/ui'
import { OtpDigitInput, otpDigitCount } from '@/shared/components/OtpDigitInput'

function authFlowErrorMessage(t: ReturnType<typeof useT>, err: unknown, fallback: string) {
  if (!(err instanceof ApiError)) return fallback
  switch (err.message) {
    case 'USER_ALREADY_REGISTERED':
      return t('auth.emailAlreadyRegistered')
    case 'RESEND_RATE_LIMIT':
      return t('auth.resendRateLimit')
    case 'RESEND_FAILED':
      return t('auth.resendFail')
    default:
      return err.message || fallback
  }
}

function VerifySignupOtpForm({
  email,
  onResend,
  resendLoading,
}: {
  email: string
  onResend: () => void
  resendLoading: boolean
}) {
  const t = useT()
  const confirmSignupOtp = useAuthStore((s) => s.confirmSignupOtp)
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await confirmSignupOtp(email, otp)
      toast.success(t('auth.welcome'))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError && err.message === 'EMAIL_NOT_VERIFIED'
          ? t('auth.emailNotVerified')
          : err instanceof ApiError
            ? err.message
            : t('auth.otpInvalid')
      setError(msg.includes('Invalid') || msg.includes('expired') || msg.includes('otp') ? t('auth.otpInvalid') : msg)
      toast.error(t('auth.otpInvalid'))
    } finally {
      setLoading(false)
    }
  }

  if (!isSupabaseAuth) return null

  return (
    <form onSubmit={(e) => void onConfirm(e)} className="mt-6 space-y-3 text-left">
      <fieldset disabled={loading} className="border-0 p-0">
        <legend className="block w-full text-sm font-medium">{t('auth.otpLabel')}</legend>
        <OtpDigitInput
          value={otp}
          onChange={(v) => {
            setOtp(v)
            setError('')
          }}
          disabled={loading}
        />
      </fieldset>
      {error && (
        <p role="alert" className="rounded-xl border border-signal/30 bg-signal/10 px-3 py-2 text-sm text-signal">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading || otp.replace(/\D/g, '').length < otpDigitCount} className="btn-primary min-h-11 w-full">
        {loading ? t('auth.confirmingCode') : t('auth.confirmCode')}
      </button>
      <button
        type="button"
        disabled={resendLoading}
        onClick={onResend}
        className="btn-secondary min-h-11 w-full"
      >
        {resendLoading ? t('auth.resending') : t('auth.resendVerification')}
      </button>
    </form>
  )
}

export function LoginPage() {
  const t = useT()
  const login = useAuthStore((s) => s.login)
  const resendSignupEmail = useAuthStore((s) => s.resendSignupEmail)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerify, setNeedsVerify] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const verifiedBanner = searchParams.get('verified') === '1'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsVerify(false)
    try {
      await login(email, password)
      toast.success(t('auth.welcome'))
      navigate(from)
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      const rawMsg = err instanceof ApiError ? err.message : ''
      if (status === 403 && rawMsg === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerify(true)
        setError(t('auth.emailNotVerified'))
      } else {
        const msg =
          status === 401
            ? t('auth.badCredentials')
            : status === 0
              ? t('auth.serverDown')
              : err instanceof ApiError
                ? err.message
                : t('auth.badCredentials')
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    if (!email) {
      toast.error(t('auth.resendNeedEmail'))
      return
    }
    setResendLoading(true)
    try {
      if (supabase) {
        await resendSignupEmail(email)
        toast.success(t('auth.checkEmail'))
      } else {
        const res = await api.resendVerification(email)
        toast.success(res.message)
      }
    } catch (err) {
      toast.error(authFlowErrorMessage(t, err, t('auth.resendFail')))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="page-mesh mx-auto flex max-w-md flex-col gap-6 px-4 py-16 pb-28 lg:pb-10">
      <GlassCard>
        <h1 className="font-display text-2xl font-bold">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('auth.loginSub')}</p>
        {verifiedBanner && (
          <p className="mt-4 rounded-xl border border-success-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-800 dark:text-success-300">
            {t('auth.verifySuccess')}
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            {t('auth.email')}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
                setNeedsVerify(false)
              }}
              className="input-field"
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-medium">
            {t('auth.password')}
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              className="input-field"
              autoComplete="current-password"
            />
          </label>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-signal/30 bg-signal/10 px-3 py-2 text-sm font-medium text-signal"
            >
              {error}
            </p>
          )}
          {needsVerify && isSupabaseAuth && (
            <VerifySignupOtpForm
              email={email}
              onResend={() => void onResend()}
              resendLoading={resendLoading}
            />
          )}
          {needsVerify && !isSupabaseAuth && (
            <>
              <button
                type="button"
                disabled={resendLoading}
                onClick={() => void onResend()}
                className="btn-secondary w-full min-h-11"
              >
                {resendLoading ? t('auth.resending') : t('auth.resendVerification')}
              </button>
              <p className="text-muted text-xs leading-relaxed">{t('auth.emailDeliveryHint')}</p>
            </>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full min-h-11 py-2.5">
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
  const resendSignupEmail = useAuthStore((s) => s.resendSignupEmail)
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', password: '', display_name: '' })
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [pendingWasExisting, setPendingWasExisting] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await register(form)
      if (res.loggedIn) {
        toast.success(res.alreadyHadAccount ? t('auth.alreadyHadAccountLogin') : t('auth.welcome'))
        navigate('/dashboard', { replace: true })
        return
      }
      setPendingWasExisting(!!res.existingAccountResent)
      setPendingEmail(res.email)
      toast.success(
        res.existingAccountResent ? t('auth.checkEmailExistingResent') : t('auth.checkEmail'),
      )
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0
      toast.error(
        status === 0 && !(err instanceof ApiError)
          ? t('auth.serverDown')
          : authFlowErrorMessage(t, err, t('auth.registerFail')),
      )
    } finally {
      setLoading(false)
    }
  }

  async function onResend() {
    if (!pendingEmail) return
    setResendLoading(true)
    try {
      if (supabase) {
        await resendSignupEmail(pendingEmail)
        toast.success(t('auth.checkEmail'))
      } else {
        const res = await api.resendVerification(pendingEmail)
        toast.success(res.message)
      }
    } catch (err) {
      toast.error(authFlowErrorMessage(t, err, t('auth.resendFail')))
    } finally {
      setResendLoading(false)
    }
  }

  if (pendingEmail) {
    return (
      <div className="page-mesh mx-auto flex max-w-md flex-col gap-6 px-4 py-16 pb-28 lg:pb-10">
        <GlassCard className="text-center">
          <h1 className="font-display text-2xl font-bold">{t('auth.checkEmailTitle')}</h1>
          <p className="text-muted mt-3">
            {isSupabaseAuth
              ? t(
                  pendingWasExisting ? 'auth.checkEmailBodyExistingUnconfirmed' : 'auth.checkEmailBodySupabase',
                  { email: pendingEmail },
                )
              : t('auth.checkEmailBody', { email: pendingEmail })}
          </p>
          {isSupabaseAuth ? (
            <VerifySignupOtpForm
              email={pendingEmail}
              onResend={() => void onResend()}
              resendLoading={resendLoading}
            />
          ) : (
            <>
              <button
                type="button"
                disabled={resendLoading}
                onClick={() => void onResend()}
                className="btn-secondary mt-6 min-h-11 w-full"
              >
                {resendLoading ? t('auth.resending') : t('auth.resendVerification')}
              </button>
              <Link to="/login" className="btn-primary mt-3 inline-flex min-h-11 w-full items-center justify-center">
                {t('auth.loginLink')}
              </Link>
            </>
          )}
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="page-mesh mx-auto flex max-w-md flex-col gap-6 px-4 py-16 pb-28 lg:pb-10">
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
                minLength={field === 'password' ? 6 : undefined}
                autoComplete={field === 'password' ? 'new-password' : undefined}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="input-field"
              />
            </label>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full min-h-11 py-2.5">
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

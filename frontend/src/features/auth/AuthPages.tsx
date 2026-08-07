import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/features/auth/authStore'
import { api, ApiError } from '@/shared/lib/api'
import { isSupabaseAuth, supabase } from '@/shared/lib/supabase'
import { useT } from '@/shared/i18n'
import { OtpDigitInput, otpDigitCount } from '@/shared/components/OtpDigitInput'
import { FloatingLabelInput } from '@/shared/components/FloatingLabelInput'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { GoogleSignInBlock } from '@/features/auth/GoogleSignInButton'
import { cn } from '@/shared/lib/utils'

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

function useResendCooldown(seconds = 60) {
  const [until, setUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (until <= Date.now()) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [until])
  const left = Math.max(0, Math.ceil((until - now) / 1000))
  return {
    cooldownLeft: left,
    startCooldown: () => setUntil(Date.now() + seconds * 1000),
  }
}

function VerifySignupOtpForm({
  email,
  onResend,
  resendLoading,
  resendCooldownLeft,
  onSuccess,
}: {
  email: string
  onResend: () => void
  resendLoading: boolean
  resendCooldownLeft: number
  onSuccess?: () => void
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
      if (onSuccess) onSuccess()
      else navigate('/dashboard', { replace: true })
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
        disabled={resendLoading || resendCooldownLeft > 0}
        onClick={onResend}
        className="btn-secondary min-h-11 w-full"
      >
        {resendLoading
          ? t('auth.resending')
          : resendCooldownLeft > 0
            ? t('auth.resendWaitSeconds').replace('{sec}', String(resendCooldownLeft))
            : t('auth.resendVerification')}
      </button>
      <p className="text-muted text-xs leading-relaxed">{t('auth.resendSupabaseHint')}</p>
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
  const { cooldownLeft: resendCooldownLeft, startCooldown: startResendCooldown } = useResendCooldown()
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
        startResendCooldown()
        toast.success(t('auth.checkEmail'))
      } else {
        const res = await api.resendVerification(email)
        startResendCooldown()
        toast.success(res.message)
      }
    } catch (err) {
      if (err instanceof ApiError && err.message === 'RESEND_RATE_LIMIT') startResendCooldown()
      toast.error(authFlowErrorMessage(t, err, t('auth.resendFail')))
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <AuthScreen
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSub')}
      banner={
        verifiedBanner ? (
          <p className="mt-4 rounded-xl border border-success-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-800 dark:text-success-300">
            {t('auth.verifySuccess')}
          </p>
        ) : undefined
      }
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {t('auth.registerLink')}
          </Link>
        </>
      }
    >
      <GoogleSignInBlock className="!mt-0" />
      <form onSubmit={onSubmit} className="mt-1 space-y-3">
          <FloatingLabelInput
            id="login-email"
            label={t('auth.email')}
            type="email"
            required
            value={email}
            autoComplete="email"
            onChange={(v) => {
              setEmail(v)
              setError('')
              setNeedsVerify(false)
            }}
          />
          <FloatingLabelInput
            id="login-password"
            label={t('auth.password')}
            type="password"
            required
            value={password}
            autoComplete="current-password"
            onChange={(v) => {
              setPassword(v)
              setError('')
            }}
          />
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
              resendCooldownLeft={resendCooldownLeft}
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
    </AuthScreen>
  )
}

export function RegisterPage() {
  const t = useT()
  const register = useAuthStore((s) => s.register)
  const resendSignupEmail = useAuthStore((s) => s.resendSignupEmail)
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  const [form, setForm] = useState({ email: '', username: '', password: '', display_name: '' })
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [pendingWasExisting, setPendingWasExisting] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const { cooldownLeft: resendCooldownLeft, startCooldown: startResendCooldown } = useResendCooldown()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await register(form)
      if (res.loggedIn) {
        toast.success(res.alreadyHadAccount ? t('auth.alreadyHadAccountLogin') : t('auth.welcome'))
        navigate(returnTo, { replace: true })
        return
      }
      setPendingWasExisting(!!res.existingAccountResent)
      setPendingEmail(res.email)
      startResendCooldown()
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
        startResendCooldown()
        toast.success(t('auth.checkEmail'))
      } else {
        const res = await api.resendVerification(pendingEmail)
        startResendCooldown()
        toast.success(res.message)
      }
    } catch (err) {
      if (err instanceof ApiError && err.message === 'RESEND_RATE_LIMIT') startResendCooldown()
      toast.error(authFlowErrorMessage(t, err, t('auth.resendFail')))
    } finally {
      setResendLoading(false)
    }
  }

  if (pendingEmail) {
    return (
      <AuthScreen
        title={t('auth.checkEmailTitle')}
        subtitle={
          isSupabaseAuth
            ? t(
                pendingWasExisting ? 'auth.checkEmailBodyExistingUnconfirmed' : 'auth.checkEmailBodySupabase',
                { email: pendingEmail },
              )
            : t('auth.checkEmailBody', { email: pendingEmail })
        }
        footer={
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {t('auth.loginLink')}
          </Link>
        }
      >
        {isSupabaseAuth ? (
          <VerifySignupOtpForm
            email={pendingEmail}
            onResend={() => void onResend()}
            resendLoading={resendLoading}
            resendCooldownLeft={resendCooldownLeft}
            onSuccess={() => {
              setPendingEmail(null)
              navigate(returnTo, { replace: true })
            }}
          />
        ) : (
          <>
            <button
              type="button"
              disabled={resendLoading}
              onClick={() => void onResend()}
              className="btn-secondary min-h-11 w-full"
            >
              {resendLoading ? t('auth.resending') : t('auth.resendVerification')}
            </button>
          </>
        )}
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      compact
      title={t('auth.registerTitle')}
      subtitle={t('auth.loginSub')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {t('auth.loginLink')}
          </Link>
        </>
      }
    >
      <GoogleSignInBlock className="!mt-0" dense />
      <form onSubmit={onSubmit} className="mt-3 space-y-2.5">
          <FloatingLabelInput
            id="reg-name"
            label={t('auth.name')}
            required
            value={form.display_name}
            autoComplete="name"
            onChange={(v) => setForm({ ...form, display_name: v })}
          />
          <FloatingLabelInput
            id="reg-username"
            label={t('auth.username')}
            required
            value={form.username}
            autoComplete="username"
            onChange={(v) => setForm({ ...form, username: v })}
          />
          <FloatingLabelInput
            id="reg-email"
            label={t('auth.email')}
            type="email"
            required
            value={form.email}
            autoComplete="email"
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <FloatingLabelInput
            id="reg-password"
            label={t('auth.password')}
            type="password"
            required
            minLength={6}
            value={form.password}
            autoComplete="new-password"
            showPasswordStrength
            onChange={(v) => setForm({ ...form, password: v })}
          />
          <button type="submit" disabled={loading} className={cn('btn-primary !mt-3 w-full min-h-11 py-2.5', loading && 'is-loading')}>
          {t('auth.createAccount')}
        </button>
      </form>
    </AuthScreen>
  )
}

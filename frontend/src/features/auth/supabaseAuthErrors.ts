import { ApiError } from '@/shared/lib/api'
import type { TranslateFn } from '@/shared/i18n'

/** Stable codes — never show raw Supabase/English API text to users. */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'USER_ALREADY_REGISTERED'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'OTP_INVALID'
  | 'RESEND_RATE_LIMIT'
  | 'RESEND_FAILED'
  | 'SERVER_DOWN'
  | 'AUTH_FAILED'
  | 'GOOGLE_FAIL'

function looksEnglishTechnical(msg: string): boolean {
  if (!msg) return true
  const m = msg.toLowerCase()
  return (
    m.includes('invalid') ||
    m.includes('credentials') ||
    m.includes('jwt') ||
    m.includes('supabase') ||
    m.includes('unauthorized') ||
    m.includes('forbidden') ||
    m.includes('status code') ||
    m.includes('fetch') ||
    m.includes('network') ||
    m.includes('otp') ||
    m.includes('token') ||
    m.includes('session') ||
    m.includes('user already') ||
    m.includes('already registered') ||
    m.includes('email rate') ||
    m.includes('password should') ||
    m.includes('password is') ||
    /^error\b/.test(m) ||
    /^auth\b/.test(m)
  )
}

export function classifyAuthMessage(raw: string, status = 400): AuthErrorCode {
  const msg = raw.toLowerCase()

  if (status === 0 || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('api не отвечает')) {
    return 'SERVER_DOWN'
  }
  if (
    msg.includes('email not confirmed') ||
    msg.includes('not confirmed') ||
    msg.includes('email_not_confirmed') ||
    raw === 'EMAIL_NOT_VERIFIED'
  ) {
    return 'EMAIL_NOT_VERIFIED'
  }
  if (
    raw === 'USER_ALREADY_REGISTERED' ||
    msg.includes('already been registered') ||
    msg.includes('already registered') ||
    msg.includes('user already') ||
    msg.includes('email address has already') ||
    msg.includes('уже зарегистрирован')
  ) {
    return 'USER_ALREADY_REGISTERED'
  }
  if (
    raw === 'RESEND_RATE_LIMIT' ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('security purposes') ||
    msg.includes('once every') ||
    msg.includes('too many')
  ) {
    return 'RESEND_RATE_LIMIT'
  }
  if (raw === 'RESEND_FAILED') return 'RESEND_FAILED'
  if (
    msg.includes('weak password') ||
    msg.includes('password should be') ||
    msg.includes('password is too short') ||
    msg.includes('at least 6')
  ) {
    return 'WEAK_PASSWORD'
  }
  if (
    msg.includes('invalid email') ||
    msg.includes('unable to validate email') ||
    msg.includes('email address is invalid')
  ) {
    return 'INVALID_EMAIL'
  }
  if (
    msg.includes('otp') ||
    msg.includes('token has expired') ||
    msg.includes('token is invalid') ||
    (msg.includes('expired') && msg.includes('code'))
  ) {
    return 'OTP_INVALID'
  }
  if (
    status === 401 ||
    msg.includes('invalid login') ||
    msg.includes('invalid credentials') ||
    msg.includes('invalid email or password') ||
    msg.includes('неверный email') ||
    msg.includes('wrong password') ||
    msg.includes('неверный пароль') ||
    raw === 'INVALID_CREDENTIALS' ||
    raw === 'No session'
  ) {
    return 'INVALID_CREDENTIALS'
  }
  if (msg.includes('google') || raw === 'GOOGLE_FAIL') return 'GOOGLE_FAIL'
  return 'AUTH_FAILED'
}

export function mapSupabaseAuthError(err: { message: string; status?: number }) {
  const code = classifyAuthMessage(err.message, err.status ?? 400)
  const status =
    code === 'EMAIL_NOT_VERIFIED'
      ? 403
      : code === 'INVALID_CREDENTIALS'
        ? 401
        : code === 'USER_ALREADY_REGISTERED'
          ? 409
          : code === 'SERVER_DOWN'
            ? 0
            : (err.status ?? 400)
  return new ApiError(code, status)
}

export function mapSupabaseResendError(err: { message: string; status?: number }) {
  const code = classifyAuthMessage(err.message, err.status ?? 400)
  if (code === 'USER_ALREADY_REGISTERED') return new ApiError('USER_ALREADY_REGISTERED', 409)
  if (code === 'RESEND_RATE_LIMIT') return new ApiError('RESEND_RATE_LIMIT', 429)
  if (code === 'SERVER_DOWN') return new ApiError('SERVER_DOWN', 0)
  return new ApiError('RESEND_FAILED', err.status ?? 400)
}

export function authUserMessage(
  t: TranslateFn,
  err: unknown,
  fallback: 'auth.registerFail' | 'auth.badCredentials' | 'auth.authFailed' = 'auth.authFailed',
): string {
  if (!(err instanceof ApiError) && !(err instanceof Error)) {
    return t(fallback)
  }
  const raw = err instanceof ApiError ? err.message : err.message
  const status = err instanceof ApiError ? err.status : 400
  const code = classifyAuthMessage(raw, status)

  switch (code) {
    case 'INVALID_CREDENTIALS':
      return t('auth.badCredentials')
    case 'EMAIL_NOT_VERIFIED':
      return t('auth.emailNotVerified')
    case 'USER_ALREADY_REGISTERED':
      return t('auth.emailAlreadyRegistered')
    case 'WEAK_PASSWORD':
      return t('auth.weakPassword')
    case 'INVALID_EMAIL':
      return t('auth.invalidEmail')
    case 'OTP_INVALID':
      return t('auth.otpInvalid')
    case 'RESEND_RATE_LIMIT':
      return t('auth.resendRateLimit')
    case 'RESEND_FAILED':
      return t('auth.resendFail')
    case 'SERVER_DOWN':
      return t('auth.serverDown')
    case 'GOOGLE_FAIL':
      return t('auth.googleSignInFail')
    case 'AUTH_FAILED':
    default:
      if (!looksEnglishTechnical(raw) && raw.trim() && status !== 500) {
        if (/[а-яё]/i.test(raw) || /[ӣӯқҳҷғ]/i.test(raw)) return raw
      }
      return t(fallback)
  }
}

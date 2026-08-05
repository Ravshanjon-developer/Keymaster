import { ApiError } from '@/shared/lib/api'

export function mapSupabaseAuthError(err: { message: string; status?: number }) {
  const msg = err.message.toLowerCase()
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
    return new ApiError('EMAIL_NOT_VERIFIED', 403)
  }
  return new ApiError(err.message, err.status ?? 400)
}

export function mapSupabaseResendError(err: { message: string; status?: number }) {
  const msg = err.message.toLowerCase()
  if (
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('security purposes') ||
    msg.includes('once every') ||
    msg.includes('too many')
  ) {
    return new ApiError('RESEND_RATE_LIMIT', 429)
  }
  if (
    msg.includes('already been registered') ||
    msg.includes('already registered') ||
    msg.includes('user already') ||
    msg.includes('email address has already')
  ) {
    return new ApiError('USER_ALREADY_REGISTERED', 409)
  }
  return new ApiError('RESEND_FAILED', err.status ?? 400)
}

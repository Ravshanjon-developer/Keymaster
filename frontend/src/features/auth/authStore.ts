import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { api, ApiError, type UserDto } from '@/shared/lib/api'
import { authRedirectUrl, isSupabaseAuth, supabase } from '@/shared/lib/supabase'
import { mapSupabaseAuthError, mapSupabaseResendError } from '@/features/auth/supabaseAuthErrors'
import { levelTitleKey, useT } from '@/shared/i18n'
import { levelFromXp } from '@/shared/lib/levels'

/** Avoid onAuthStateChange racing confirmSignupOtp (navbar updates before OTP UI closes). */
let otpConfirmInFlight = false

async function fetchMeWithRetry(): Promise<UserDto> {
  try {
    return await api.me()
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) {
      await new Promise((r) => setTimeout(r, 500))
      return await api.me()
    }
    throw err
  }
}

interface AuthState {
  token: string | null
  user: UserDto | null
  authReady: boolean
  setSession: (token: string, user: UserDto) => void
  logout: () => void
  refreshUser: () => Promise<void>
  initAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    username: string
    password: string
    display_name: string
  }) => Promise<{
    message: string
    email: string
    loggedIn?: boolean
    existingAccountResent?: boolean
    alreadyHadAccount?: boolean
  }>
  confirmSignupOtp: (email: string, code: string) => Promise<void>
  resendSignupEmail: (email: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      authReady: !isSupabaseAuth,
      setSession: (token, user) => {
        localStorage.setItem('km_token', token)
        set({ token, user, authReady: true })
      },
      logout: () => {
        localStorage.removeItem('km_token')
        set({ token: null, user: null })
        if (supabase) void supabase.auth.signOut()
      },
      refreshUser: async () => {
        if (!get().token) return
        const user = await api.me()
        set({ user })
      },
      initAuth: async () => {
        if (!supabase) {
          set({ authReady: true })
          return
        }
        supabase.auth.onAuthStateChange((_event, session) => {
          if (otpConfirmInFlight) return
          if (session?.access_token) {
            localStorage.setItem('km_token', session.access_token)
            set({ token: session.access_token })
            void api.me().then(
              (user) => set({ user }),
              () => set({ user: null }),
            )
          } else if (!get().token) {
            set({ token: null, user: null })
          }
        })
        const { data } = await supabase.auth.getSession()
        if (data.session?.access_token) {
          localStorage.setItem('km_token', data.session.access_token)
          set({ token: data.session.access_token })
          try {
            const user = await api.me()
            set({ user, authReady: true })
          } catch {
            set({ user: null, authReady: true })
          }
        } else {
          set({ authReady: true })
        }
      },
      login: async (email, password) => {
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw mapSupabaseAuthError(error)
          const token = data.session?.access_token
          if (!token) throw new ApiError('No session', 401)
          localStorage.setItem('km_token', token)
          const user = await api.me()
          set({ token, user })
          return
        }
        const { access_token } = await api.login({ email, password })
        localStorage.setItem('km_token', access_token)
        const user = await api.me()
        set({ token: access_token, user })
      },
      register: async (data) => {
        if (supabase) {
          const { data: signUpData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              emailRedirectTo: authRedirectUrl(),
              data: {
                username: data.username,
                display_name: data.display_name,
              },
            },
          })
          if (error) throw mapSupabaseAuthError(error)
          if (signUpData.user?.identities?.length === 0) {
            const email = data.email.trim()
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password: data.password,
            })
            if (loginData.session?.access_token) {
              localStorage.setItem('km_token', loginData.session.access_token)
              const user = await api.me()
              set({ token: loginData.session.access_token, user, authReady: true })
              return {
                message: 'Аккаунт уже был — выполнен вход.',
                email: data.email,
                loggedIn: true,
                alreadyHadAccount: true,
              }
            }
            const loginMsg = (loginError?.message ?? '').toLowerCase()
            const awaitingConfirm =
              loginMsg.includes('not confirmed') ||
              loginMsg.includes('email not confirmed') ||
              loginMsg.includes('email_not_confirmed')
            if (awaitingConfirm) {
              await get().resendSignupEmail(email)
              return {
                message: 'Код отправлен повторно.',
                email: data.email,
                loggedIn: false,
                existingAccountResent: true,
              }
            }
            if (
              loginMsg.includes('invalid login') ||
              loginMsg.includes('invalid credentials') ||
              loginMsg.includes('invalid email or password')
            ) {
              throw new ApiError('USER_ALREADY_REGISTERED', 409)
            }
            try {
              await get().resendSignupEmail(email)
              return {
                message: 'Код отправлен повторно.',
                email: data.email,
                loggedIn: false,
                existingAccountResent: true,
              }
            } catch {
              throw new ApiError('USER_ALREADY_REGISTERED', 409)
            }
          }
          const accessToken = signUpData.session?.access_token
          if (accessToken) {
            localStorage.setItem('km_token', accessToken)
            const user = await api.me()
            set({ token: accessToken, user, authReady: true })
            return {
              message: 'Регистрация завершена.',
              email: signUpData.user?.email ?? data.email,
              loggedIn: true,
            }
          }
          return {
            message: 'На ваш email отправлен код подтверждения.',
            email: data.email,
            loggedIn: false,
          }
        }
        return api.register(data)
      },
      confirmSignupOtp: async (email, code) => {
        if (!supabase) throw new ApiError('Supabase not configured', 400)
        const tokenDigits = code.replace(/\D/g, '')
        if (tokenDigits.length < 6) throw new ApiError('Invalid OTP', 400)
        otpConfirmInFlight = true
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: tokenDigits,
            type: 'signup',
          })
          if (error) throw mapSupabaseAuthError(error)
          const accessToken = data.session?.access_token
          if (!accessToken) throw new ApiError('No session', 401)
          localStorage.setItem('km_token', accessToken)
          const user = await fetchMeWithRetry()
          set({ token: accessToken, user, authReady: true })
        } finally {
          otpConfirmInFlight = false
        }
      },
      resendSignupEmail: async (email) => {
        if (!supabase) throw new ApiError('Supabase not configured', 400)
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim(),
          options: { emailRedirectTo: authRedirectUrl() },
        })
        if (error) throw mapSupabaseResendError(error)
      },
      loginWithGoogle: async () => {
        if (!supabase) throw new ApiError('Supabase not configured', 400)
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: authRedirectUrl() },
        })
        if (error) throw mapSupabaseAuthError(error)
      },
    }),
    { name: 'km-auth', partialize: (s) => ({ token: s.token, user: s.user }) },
  ),
)

export function useLevelInfo() {
  const xp = useAuthStore((s) => s.user?.xp ?? 0)
  const t = useT()
  const info = levelFromXp(xp)
  return { ...info, title: t(levelTitleKey(info.level)) }
}

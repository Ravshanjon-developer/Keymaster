import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { api, ApiError, type UserDto } from '@/shared/lib/api'
import { authRedirectUrl, isSupabaseAuth, supabase } from '@/shared/lib/supabase'
import { levelTitleKey, useT } from '@/shared/i18n'
import { levelFromXp } from '@/shared/lib/levels'

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
  }) => Promise<{ message: string; email: string }>
}

function mapSupabaseAuthError(err: { message: string; status?: number }) {
  const msg = err.message.toLowerCase()
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
    return new ApiError('EMAIL_NOT_VERIFIED', 403)
  }
  return new ApiError(err.message, err.status ?? 400)
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
          const { error } = await supabase.auth.signUp({
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
          return {
            message:
              'На ваш email отправлено письмо от Supabase. Перейдите по ссылке для подтверждения.',
            email: data.email,
          }
        }
        return api.register(data)
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

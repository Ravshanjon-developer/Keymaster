import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { api, type UserDto } from '@/shared/lib/api'
import { levelTitleKey, useT } from '@/shared/i18n'
import { levelFromXp } from '@/shared/lib/levels'

interface AuthState {
  token: string | null
  user: UserDto | null
  setSession: (token: string, user: UserDto) => void
  logout: () => void
  refreshUser: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; username: string; password: string; display_name: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => {
        localStorage.setItem('km_token', token)
        set({ token, user })
      },
      logout: () => {
        localStorage.removeItem('km_token')
        set({ token: null, user: null })
      },
      refreshUser: async () => {
        if (!get().token) return
        const user = await api.me()
        set({ user })
      },
      login: async (email, password) => {
        const { access_token } = await api.login({ email, password })
        localStorage.setItem('km_token', access_token)
        const user = await api.me()
        set({ token: access_token, user })
      },
      register: async (data) => {
        const { access_token } = await api.register(data)
        localStorage.setItem('km_token', access_token)
        const user = await api.me()
        set({ token: access_token, user })
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

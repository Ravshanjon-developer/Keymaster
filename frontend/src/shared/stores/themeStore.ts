import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

const THEME_TRANSITION_MS = 280

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.add('theme-animate')
  document.documentElement.classList.toggle('dark', theme === 'dark')
  window.setTimeout(() => {
    document.documentElement.classList.remove('theme-animate')
  }, THEME_TRANSITION_MS)
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggle: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        applyThemeClass(next)
        set({ theme: next })
      },
      setTheme: (theme) => {
        applyThemeClass(theme)
        set({ theme })
      },
    }),
    { name: 'km-theme' },
  ),
)

export function initTheme() {
  const stored = localStorage.getItem('km-theme')
  let theme: Theme = 'light'
  if (stored) {
    try {
      theme = (JSON.parse(stored) as { state: { theme: Theme } }).state.theme
    } catch {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'dark'
  }
  document.documentElement.classList.toggle('dark', theme === 'dark')
  useThemeStore.setState({ theme })
}

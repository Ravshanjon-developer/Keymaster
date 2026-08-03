import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Locale } from '@/shared/i18n/types'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

function applyDocumentLang(locale: Locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale === 'tg' ? 'tg' : 'ru'
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'ru',
      setLocale: (locale) => {
        applyDocumentLang(locale)
        set({ locale })
      },
    }),
    {
      name: 'km-locale',
      onRehydrateStorage: () => (state) => {
        if (state?.locale) applyDocumentLang(state.locale)
      },
    },
  ),
)

export function initLocale() {
  const stored = localStorage.getItem('km-locale')
  let locale: Locale = 'ru'
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { state?: { locale?: Locale } }
      if (parsed.state?.locale === 'tg' || parsed.state?.locale === 'ru') {
        locale = parsed.state.locale
      }
    } catch {
      locale = 'ru'
    }
  }
  applyDocumentLang(locale)
  useLocaleStore.setState({ locale })
}

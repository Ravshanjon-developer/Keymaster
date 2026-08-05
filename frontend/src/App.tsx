import { BrowserRouter } from 'react-router'

import { AppRouter } from '@/app/router'
import { AppProviders } from '@/app/providers'
import { AuthInit } from '@/features/auth/AuthInit'
import { initLocale } from '@/shared/i18n'
import { initTheme } from '@/shared/stores/themeStore'

initTheme()
initLocale()

export default function App() {
  return (
    <AppProviders>
      <AuthInit>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AuthInit>
    </AppProviders>
  )
}

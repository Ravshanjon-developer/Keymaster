import { BrowserRouter } from 'react-router-dom'

import { AppRouter } from '@/app/router'
import { AppProviders } from '@/app/providers'
import { initLocale } from '@/shared/i18n'
import { initTheme } from '@/shared/stores/themeStore'

initTheme()
initLocale()

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  )
}

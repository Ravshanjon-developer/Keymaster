import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { BottomNav } from '@/shared/components/BottomNav'
import { Navbar } from '@/shared/components/Navbar'
import { useT } from '@/shared/i18n'

export function AppLayout() {
  const t = useT()
  const { pathname } = useLocation()
  const immersive = pathname === '/simulator'

  useEffect(() => {
    if (!immersive) return
    const html = document.documentElement
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [immersive])

  if (immersive) {
    return (
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#1e1e1e]">
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <a href="#main-content" className="skip-link">
        {t('nav.skipToContent')}
      </a>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"
      >
        <Outlet />
      </main>
      <footer className="hidden border-t border-black/[0.06] py-9 pb-12 text-center text-[13px] text-slate-600 sm:block dark:border-white/[0.06] dark:text-slate-400">
        <span className="font-display font-semibold text-ink dark:text-slate-200">KeyMaster</span>
        <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
        © {new Date().getFullYear()}
        <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
        {t('footer.tagline')}
      </footer>
      <BottomNav />
    </div>
  )
}

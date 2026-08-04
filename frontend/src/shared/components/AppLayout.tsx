import { Outlet } from 'react-router-dom'

import { BottomNav } from '@/shared/components/BottomNav'
import { Navbar } from '@/shared/components/Navbar'
import { useT } from '@/shared/i18n'

export function AppLayout() {
  const t = useT()
  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <Navbar />
      <main className="flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <Outlet />
      </main>
      <footer className="hidden border-t border-black/[0.06] py-9 text-center text-[13px] text-slate-500 sm:block dark:border-white/[0.06] dark:text-slate-500">
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

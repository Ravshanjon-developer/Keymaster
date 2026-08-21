import { BookOpen, Map, Trophy } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { useT } from '@/shared/i18n'
import { PRACTICE_ICON_STROKE, practiceIcons } from '@/shared/lib/practiceNavIcons'
import { cn } from '@/shared/lib/utils'
import { isPracticeRoute } from '@/shared/lib/practiceRoutes'

const items = [
  { to: '/courses', labelKey: 'courses' as const, icon: BookOpen },
  { to: '/path', labelKey: 'path' as const, icon: Map },
  { to: '/practice', labelKey: 'practice' as const, icon: practiceIcons.practice },
  { to: '/leaderboard', labelKey: 'leaderboard' as const, icon: Trophy },
]

export function BottomNav() {
  const t = useT()
  const location = useLocation()
  const labels = {
    courses: t('nav.courses'),
    path: t('nav.path'),
    practice: t('nav.practice'),
    leaderboard: t('nav.leaderboard'),
  }

  const hideOnAuth = location.pathname === '/login' || location.pathname === '/register'

  if (hideOnAuth) return null

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-default)] bg-[var(--bg-elevated)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label={t('nav.mobileTabBar')}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const practiceActive = labelKey === 'practice' && isPracticeRoute(location.pathname)
          return (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold transition active:scale-95',
                  isActive || practiceActive
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden strokeWidth={PRACTICE_ICON_STROKE} />
              <span className="max-w-[4.5rem] truncate leading-tight">{labels[labelKey]}</span>
            </NavLink>
          </li>
          )
        })}
      </ul>
    </nav>
  )
}

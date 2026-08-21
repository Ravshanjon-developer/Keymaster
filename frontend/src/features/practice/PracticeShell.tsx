import { Code2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/authStore'
import { useT } from '@/shared/i18n'
import { PRACTICE_ICON_STROKE, practiceIcons } from '@/shared/lib/practiceNavIcons'
import { cn } from '@/shared/lib/utils'

type ShellNavItem = {
  to: string
  icon: LucideIcon
  label: string
  end?: boolean
  isActive?: (pathname: string, search: string) => boolean
}

const skillsNav = (t: ReturnType<typeof useT>): ShellNavItem[] => [
  { to: '/practice', icon: practiceIcons.hub, label: t('practiceShell.hub'), end: true },
  { to: '/typing', icon: practiceIcons.typing, label: t('practiceShell.typing') },
  {
    to: '/simulator?mode=desktop',
    icon: practiceIcons.desktop,
    label: t('practiceShell.desktopSimulator'),
    isActive: (pathname, search) => pathname === '/simulator' && search.includes('mode=desktop'),
  },
  {
    to: '/simulator',
    icon: practiceIcons.simulator,
    label: t('practiceShell.simulator'),
    end: true,
    isActive: (pathname, search) => pathname === '/simulator' && !search.includes('mode=desktop'),
  },
  {
    to: '/training?course=programmer-basics',
    icon: practiceIcons.hotkeys,
    label: t('practiceShell.shortcuts'),
    isActive: (pathname) => pathname === '/training',
  },
  { to: '/speed', icon: practiceIcons.speed, label: t('practiceShell.speed'), end: true },
]

const reinforceNav = (t: ReturnType<typeof useT>): ShellNavItem[] => [
  {
    to: '/review?course=programmer-basics',
    icon: practiceIcons.review,
    label: t('practice.reviewTitle'),
    isActive: (pathname) => pathname === '/review',
  },
  { to: '/quiz', icon: practiceIcons.quiz, label: t('practice.quizTitle') },
  { to: '/exam', icon: practiceIcons.exam, label: t('practice.examTitle'), end: true },
]

function shellLinkClass(isActive: boolean) {
  return cn(
    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-[#1e2636] text-[#adc6ff] before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r before:bg-[#89ceff]'
      : 'text-[#a8b0c3] hover:bg-white/[0.04] hover:text-white',
  )
}

function ShellNavLinks({ items, compact }: { items: ShellNavItem[]; compact?: boolean }) {
  const { pathname, search } = useLocation()

  return (
    <>
      {items.map(({ to, icon: Icon, label, end, isActive: isActiveFn }) => {
        const active = isActiveFn ? isActiveFn(pathname, search) : undefined
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => {
              const on = active ?? isActive
              return compact
                ? cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap',
                    on ? 'bg-[#1e2636] text-[#adc6ff]' : 'text-[#a8b0c3]',
                  )
                : shellLinkClass(on)
            }}
          >
            {compact ? (
              <>
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={PRACTICE_ICON_STROKE} aria-hidden />
                {label}
              </>
            ) : (
              <>
                <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={PRACTICE_ICON_STROKE} aria-hidden />
                {label}
              </>
            )}
          </NavLink>
        )
      })}
    </>
  )
}

/** Practice shell: left rail for skill modes + main stage. */
export function PracticeShell() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const { pathname } = useLocation()
  const isSimulator = pathname === '/simulator'
  const skills = skillsNav(t)
  const reinforce = reinforceNav(t)

  if (isSimulator) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col bg-[#1e1e1e]">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 bg-[#10131a]">
      <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-[240px] shrink-0 flex-col border-r border-[#2a2f3a] bg-[#141820] text-[#e1e2ec] lg:flex">
        <div className="border-b border-[#2a2f3a] px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600/25 text-brand-300">
              <Code2 className="h-4 w-4" strokeWidth={PRACTICE_ICON_STROKE} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">KeyMaster</p>
              <p className="text-[11px] text-[#8b93a7]">
                {user
                  ? t('practiceShell.levelLine').replace('{level}', String(user.level ?? 1))
                  : t('practiceShell.guest')}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label={t('practiceShell.navLabel')}>
          <ShellNavLinks items={skills} />
          <p className="mx-3 mt-4 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#6f788c]">
            {t('practice.reinforceSection')}
          </p>
          <ShellNavLinks items={reinforce} />
        </nav>

        <div className="border-t border-[#2a2f3a] p-4">
          <p className="text-[11px] leading-relaxed text-[#6f788c]">{t('practiceShell.hint')}</p>
          <NavLink
            to="/dashboard"
            className="mt-3 block text-[11px] font-semibold text-[#89ceff] hover:underline"
          >
            {t('practiceShell.dashboard')} →
          </NavLink>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-x-hidden bg-[var(--bg-primary)] text-ink dark:text-[var(--text-primary)]">
        <div className="flex gap-2 overflow-x-auto border-b border-[#2a2f3a] bg-[#141820] px-3 py-2 text-[#e1e2ec] lg:hidden">
          <ShellNavLinks items={[...skills, ...reinforce]} compact />
        </div>
        <Outlet />
      </div>
    </div>
  )
}

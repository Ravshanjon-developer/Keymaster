import { ChevronDown, Menu, Moon, Sun, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/authStore'
import { useLocaleStore, useT, type Locale } from '@/shared/i18n'
import { useThemeStore } from '@/shared/stores/themeStore'
import { cn } from '@/shared/lib/utils'

function navLinkClass(isActive: boolean) {
  return cn('km-nav-link', isActive && 'km-nav-link--active')
}

function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const t = useT()

  const options: { id: Locale; label: string }[] = [
    { id: 'ru', label: t('nav.langRu') },
    { id: 'tg', label: t('nav.langTg') },
  ]

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-ink/10 p-0.5 dark:border-white/15',
        compact ? 'w-full' : '',
      )}
      role="group"
      aria-label={t('nav.language')}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setLocale(opt.id)}
          className={cn(
            'rounded-md px-2.5 py-1 text-[12px] font-bold tracking-wide transition',
            compact && 'flex-1',
            locale === opt.id
              ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-ink'
              : 'text-ink/70 hover:text-ink dark:text-slate-300 dark:hover:text-white',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Navbar() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const toggle = useThemeStore((s) => s.toggle)
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [practiceOpen, setPracticeOpen] = useState(false)
  const practiceRef = useRef<HTMLDivElement>(null)

  const learnNav = [
    { to: '/courses', label: t('nav.courses') },
    { to: '/path', label: t('nav.path') },
  ]

  const practiceNav = [
    { to: '/review', label: t('nav.review'), hint: t('nav.reviewHint') },
    { to: '/quiz', label: t('nav.quiz'), hint: t('nav.quizHint') },
    { to: '/training', label: t('nav.training'), hint: t('nav.trainingHint') },
    { to: '/exam', label: t('nav.exam'), hint: t('nav.examHint') },
    { to: '/speed', label: t('nav.speed'), hint: t('nav.speedHint') },
  ]

  const mobileLearnNav = [
    { to: '/review', label: t('nav.review') },
    { to: '/quiz', label: t('nav.quiz') },
  ]

  const communityNav = [{ to: '/leaderboard', label: t('nav.leaderboard') }]

  const mobileSections = [
    { title: t('nav.learnGroup'), items: learnNav },
    { title: t('nav.mobileLearnGroup'), items: mobileLearnNav },
    { title: t('nav.practiceGroup'), items: practiceNav },
    { title: t('nav.communityGroup'), items: communityNav },
  ]

  const practiceActive = practiceNav.some((item) => location.pathname.startsWith(item.to))

  useEffect(() => {
    setPracticeOpen(false)
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 6)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!practiceRef.current?.contains(e.target as Node)) setPracticeOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <header className={cn('km-nav-bar', scrolled && 'km-nav-bar--scrolled')}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 tracking-tight text-ink dark:text-white">
          <img
            src="/logo-mark.png"
            alt="KeyMaster"
            width={36}
            height={36}
            className="h-9 w-9 rounded-[10px] object-contain"
          />
          <span className="font-display text-[1.4rem] font-semibold">KeyMaster</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t('nav.mainMenu')}>
          {learnNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}

          <div className="mx-1 h-5 w-px bg-ink/10 dark:bg-white/15" aria-hidden />

          <div className="relative" ref={practiceRef}>
            <button
              type="button"
              onClick={() => setPracticeOpen((v) => !v)}
              className={cn(navLinkClass(practiceActive), 'inline-flex items-center gap-1')}
              aria-expanded={practiceOpen}
              aria-haspopup="menu"
            >
              {t('nav.practice')}
              <ChevronDown className={cn('h-4 w-4 transition', practiceOpen && 'rotate-180')} />
            </button>
            {practiceOpen && (
              <div
                role="menu"
                className="absolute left-0 top-[calc(100%+0.4rem)] z-[var(--z-dropdown)] min-w-[14.5rem] overflow-hidden rounded-[var(--radius-dropdown)] border border-[var(--border-default)] bg-[var(--bg-elevated)] py-1.5"
                style={{ boxShadow: 'var(--shadow-float)' }}
              >
                {practiceNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    role="menuitem"
                    className={cn(
                      'block px-3.5 py-2.5 transition hover:bg-brand-50 dark:hover:bg-white/[0.05]',
                      location.pathname.startsWith(item.to) && 'bg-brand-50 dark:bg-brand-500/10',
                    )}
                  >
                    <span className="block text-[15px] font-semibold text-ink dark:text-white">{item.label}</span>
                    <span className="mt-0.5 block text-[12px] font-medium text-ink-soft/80 dark:text-slate-400">
                      {item.hint}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mx-1 h-5 w-px bg-ink/10 dark:bg-white/15" aria-hidden />

          {communityNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => navLinkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <button
            type="button"
            onClick={toggle}
            className="btn-ghost km-theme-toggle !min-h-0 p-2"
            aria-label={t('nav.toggleTheme')}
          >
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="hidden h-5 w-5 dark:block" />
          </button>

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-[14px] font-semibold text-ink transition hover:bg-ink/[0.05] dark:text-slate-100 dark:hover:bg-white/[0.06] sm:inline-flex"
              >
                <span className="max-w-[7.5rem] truncate">{user.display_name}</span>
                <span className="rounded-md bg-brand-700/12 px-1.5 py-0.5 text-[12px] font-bold tabular-nums text-brand-900 dark:bg-brand-400/15 dark:text-brand-100">
                  {user.xp} XP
                </span>
              </Link>
              {user.is_admin && (
                <Link to="/admin" className="hidden text-[14px] font-semibold text-brand-800 hover:underline lg:inline">
                  {t('nav.admin')}
                </Link>
              )}
              <button
                type="button"
                onClick={logout}
                className="btn-secondary hidden !px-3 !py-1.5 text-[14px] sm:inline-flex"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-ghost hidden !min-h-0 px-2.5 py-2 text-[14px] sm:inline-flex"
              >
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn-primary hidden !px-3.5 !py-1.5 text-[14px] sm:inline-flex">
                {t('nav.register')}
              </Link>
            </>
          )}

          <button
            type="button"
            className="rounded-lg p-2 text-ink lg:hidden dark:text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label={t('nav.menu')}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="km-mobile-nav px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-4" aria-label={t('nav.mobileMenu')}>
            <LanguageSwitcher compact />

            {mobileSections.map((section) => (
              <div key={section.title}>
                <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft/70 dark:text-slate-500">
                  {section.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'rounded-lg px-3 py-2.5 text-[15px] font-semibold',
                          isActive
                            ? 'bg-brand-700/12 text-brand-900 dark:bg-brand-400/15 dark:text-brand-100'
                            : 'text-ink dark:text-slate-100',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            {user ? (
              <div className="border-t border-ink/10 pt-3 dark:border-white/10">
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink dark:text-white"
                >
                  {t('nav.dashboardXp', { xp: user.xp })}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-semibold text-signal"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 border-t border-ink/10 pt-3 dark:border-white/10">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1 text-[15px]">
                  {t('nav.login')}
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 text-[15px]">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

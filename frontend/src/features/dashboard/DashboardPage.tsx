import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { useAuthStore, useLevelInfo } from '@/features/auth/authStore'
import { NextStepCard } from '@/features/path/LearningPathPage'
import { api } from '@/shared/lib/api'
import { useT } from '@/shared/i18n'
import { GlassCard, Skeleton } from '@/shared/components/ui'

export function DashboardPage() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const level = useLevelInfo()

  const daily = useQuery({ queryKey: ['daily'], queryFn: api.daily, enabled: !!user })
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats, enabled: !!user })
  const achievements = useQuery({ queryKey: ['achievements'], queryFn: api.achievements, enabled: !!user })

  const completion = stats.data
    ? Math.min(100, Math.round((stats.data.combinations_learned / 300) * 100))
    : 0

  return (
    <div className="page-mesh mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-page-title">
            {t('dashboard.hello', { name: user?.display_name ?? t('dashboard.student') })}
          </h1>
          <p className="text-muted mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/path" className="btn-secondary">
            {t('dashboard.pathBtn')}
          </Link>
          <Link to="/training" className="btn-primary">
            {t('dashboard.continueBtn')}
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <NextStepCard />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard>
          <p className="text-sm text-slate-500">{t('dashboard.level')}</p>
          <p className="font-display text-2xl font-bold">{level.title}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-slate-700">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${level.progress}%` }} />
          </div>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-slate-500">{t('dashboard.xp')}</p>
          <p className="font-display text-2xl font-bold">{user?.xp ?? 0}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-slate-500">{t('dashboard.completion')}</p>
          <p className="font-display text-2xl font-bold">{completion}%</p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm text-slate-500">{t('dashboard.streak')}</p>
          <p className="font-display text-2xl font-bold">
            {user?.streak_days ?? 0} {t('dashboard.days')}
          </p>
        </GlassCard>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="font-display text-lg font-semibold">{t('dashboard.daily')}</h2>
          <ul className="mt-4 space-y-3">
            {daily.isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            {daily.data?.map((d) => (
              <li key={d.challenge_type} className="flex items-center justify-between text-sm">
                <span>{d.title}</span>
                <span className={d.completed ? 'font-semibold text-brand-700' : 'text-slate-500'}>
                  {d.progress}/{d.target}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard>
          <h2 className="font-display text-lg font-semibold">{t('dashboard.achievements')}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {achievements.data
              ?.filter((a) => a.unlocked)
              .slice(0, 5)
              .map((a) => (
                <li key={a.id} className="text-ink dark:text-slate-200">
                  {a.title}
                </li>
              )) ?? <p className="text-slate-500">{t('dashboard.noAchievements')}</p>}
          </ul>
        </GlassCard>
      </div>
    </div>
  )
}

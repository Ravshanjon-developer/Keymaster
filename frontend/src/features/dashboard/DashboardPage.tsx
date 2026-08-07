import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Award, Target } from 'lucide-react'

import { useAuthStore, useLevelInfo } from '@/features/auth/authStore'
import { NextStepCard } from '@/features/path/LearningPathPage'
import { api } from '@/shared/lib/api'
import { useT } from '@/shared/i18n'
import { PageHeader, PageShell, SkeletonBlock, StatTile } from '@/shared/components/PageLayout'
import { EmptyState, GlassCard, ProgressBar, Skeleton } from '@/shared/components/ui'

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

  const unlockedAchievements = achievements.data?.filter((a) => a.unlocked) ?? []

  return (
    <PageShell>
      <PageHeader
        title={t('dashboard.hello', { name: user?.display_name ?? t('dashboard.student') })}
        subtitle={t('dashboard.subtitle')}
        actions={
          <>
            <Link to="/path" className="btn-secondary">
              {t('dashboard.pathBtn')}
            </Link>
            <Link to="/training" className="btn-primary">
              {t('dashboard.continueBtn')}
            </Link>
          </>
        }
      />

      <div className="mb-6">
        <NextStepCard />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="!p-4 md:!p-5">
          <p className="text-caption font-semibold uppercase tracking-wider">{t('dashboard.level')}</p>
          <p className="font-display mt-2 text-xl font-bold text-[var(--text-primary)]">{level.title}</p>
          <ProgressBar value={level.progress} className="mt-3" />
        </GlassCard>
        <StatTile label={t('dashboard.xp')} value={user?.xp ?? 0} />
        <StatTile label={t('dashboard.completion')} value={`${completion}%`} />
        <StatTile
          label={t('dashboard.streak')}
          value={
            <>
              {user?.streak_days ?? 0} {t('dashboard.days')}
            </>
          }
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-h2 flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-600" aria-hidden />
            {t('dashboard.daily')}
          </h2>
          <ul className="mt-4 space-y-3">
            {daily.isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            {!daily.isLoading && (!daily.data || daily.data.length === 0) && (
              <p className="text-muted py-4 text-sm">{t('dashboard.dailyEmptyDesc')}</p>
            )}
            {daily.data?.map((d) => (
              <li
                key={d.challenge_type}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2.5 text-sm"
              >
                <span className="text-[var(--text-secondary)]">{d.title}</span>
                <span
                  className={
                    d.completed ? 'font-semibold text-brand-700 dark:text-brand-300' : 'text-[var(--text-muted)]'
                  }
                >
                  {d.progress}/{d.target}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard>
          <h2 className="text-h2 flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-600" aria-hidden />
            {t('dashboard.achievements')}
          </h2>
          {achievements.isLoading && (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-8 w-full" />
              ))}
            </div>
          )}
          {!achievements.isLoading && unlockedAchievements.length === 0 && (
            <div className="mt-2">
              <EmptyState
                icon={Award}
                title={t('dashboard.noAchievements')}
                description={t('dashboard.achievementsEmptyDesc')}
              />
            </div>
          )}
          <ul className="mt-4 space-y-2 text-sm">
            {unlockedAchievements.slice(0, 5).map((a) => (
              <li
                key={a.id}
                className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2 text-[var(--text-primary)]"
              >
                {a.title}
              </li>
            ))}
          </ul>
          {unlockedAchievements.length > 5 && (
            <Link to="/achievements" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
              {t('dashboard.allAchievements')}
            </Link>
          )}
        </GlassCard>
      </div>
    </PageShell>
  )
}

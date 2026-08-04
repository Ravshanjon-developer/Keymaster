import { useQuery } from '@tanstack/react-query'
import { Crown, Medal, Trophy, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useAuthStore } from '@/features/auth/authStore'
import { api, type LeaderboardDto } from '@/shared/lib/api'
import { useT } from '@/shared/i18n'
import { EmptyState, GlassCard, Skeleton } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

function podiumStyle(rank: number) {
  if (rank === 1) {
    return {
      card: 'border-accent-400/50 bg-gradient-to-b from-accent-500/20 via-[var(--bg-elevated)] to-[var(--bg-elevated)] shadow-[0_20px_50px_-28px_rgb(6_182_212_/_0.7)] md:-translate-y-3',
      badge: 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950',
      icon: Crown,
    }
  }
  if (rank === 2) {
    return {
      card: 'border-slate-300/60 bg-gradient-to-b from-slate-200/40 via-[var(--bg-elevated)] to-[var(--bg-elevated)] dark:border-slate-500/40 dark:from-slate-400/10',
      badge: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800',
      icon: Medal,
    }
  }
  return {
    card: 'border-orange-400/40 bg-gradient-to-b from-orange-400/15 via-[var(--bg-elevated)] to-[var(--bg-elevated)]',
    badge: 'bg-gradient-to-br from-orange-300 to-orange-600 text-orange-950',
    icon: Trophy,
  }
}

function PodiumCard({
  row,
  isYou,
  tall,
}: {
  row: LeaderboardDto
  isYou: boolean
  tall?: boolean
}) {
  const t = useT()
  const style = podiumStyle(row.rank)
  const Icon = style.icon

  return (
    <div
      className={cn(
        'relative flex flex-col items-center rounded-2xl border px-4 py-5 text-center transition duration-200',
        style.card,
        tall && 'md:min-h-[11.5rem]',
        isYou && 'ring-2 ring-brand-500/50',
      )}
    >
      <div
        className={cn(
          'mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm',
          style.badge,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">#{row.rank}</p>
      <p className="mt-1 line-clamp-1 text-base font-semibold text-[var(--text-primary)]">{row.display_name}</p>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">@{row.username}</p>
      <p className="mt-3 inline-flex items-center gap-1 rounded-lg bg-success-500/12 px-2.5 py-1 text-sm font-bold tabular-nums text-success-700 dark:text-success-400">
        <Zap className="h-3.5 w-3.5" />
        {row.xp} {t('social.xp')}
      </p>
      <p className="mt-2 text-xs font-medium text-brand-700 dark:text-brand-300">{row.level_title}</p>
      {isYou && (
        <span className="mt-3 rounded-md bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {t('social.you')}
        </span>
      )}
    </div>
  )
}

export function LeaderboardPage() {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all')
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => api.leaderboard(period),
  })
  const myRank = useQuery({
    queryKey: ['leaderboard-my-rank', period],
    queryFn: () => api.leaderboardMyRank(period),
    enabled: Boolean(token && user),
  })

  const periodLabel = {
    all: t('social.all'),
    week: t('social.week'),
    month: t('social.month'),
  } as const

  const top3 = useMemo(() => data?.slice(0, 3) ?? [], [data])
  const rest = useMemo(() => data?.slice(3) ?? [], [data])

  // Visual order: 2nd, 1st, 3rd on desktop podium
  const podiumOrder = useMemo(() => {
    if (top3.length === 0) return []
    const byRank = new Map(top3.map((r) => [r.rank, r]))
    const ordered = [byRank.get(2), byRank.get(1), byRank.get(3)].filter(Boolean) as LeaderboardDto[]
    return ordered.length ? ordered : top3
  }, [top3])

  return (
    <div className="page-mesh mx-auto max-w-3xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-brand-50 via-[var(--bg-elevated)] to-accent-50/60 p-6 dark:from-brand-950/50 dark:via-[var(--bg-elevated)] dark:to-accent-900/20 md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-brand-500/15 blur-3xl"
        />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
          {t('social.eyebrow')}
        </p>
        <h1 className="text-page-title mt-2 md:text-[2.4rem]">{t('social.title')}</h1>
        <p className="text-muted mt-2 max-w-xl">{t('social.subtitle')}</p>

        <div
          className="mt-6 inline-flex rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]/90 p-1 shadow-sm backdrop-blur"
          role="group"
          aria-label={t('social.periodFilter')}
        >
          {(['all', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]',
                period === p
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]',
              )}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="mt-8">
          <EmptyState title={t('courses.apiDownTitle')} description={t('courses.apiDownDesc')} />
        </div>
      )}
      {!isError && !isLoading && (!data || data.length === 0) && (
        <div className="mt-8">
          <EmptyState
            title={period === 'all' ? t('social.emptyTitle') : t('social.periodEmptyTitle')}
            description={period === 'all' ? t('social.emptyDesc') : t('social.periodEmptyDesc')}
          />
        </div>
      )}

      {!isLoading && myRank.data && !myRank.data.in_top_list && myRank.data.rank > 0 && (
        <GlassCard className="mt-6 border-brand-500/25 bg-brand-50/50 px-4 py-3 dark:bg-brand-950/30">
          <p className="text-sm font-semibold text-brand-900 dark:text-brand-100">
            {t('social.yourRankOutsideTop')
              .replace('{rank}', String(myRank.data.rank))
              .replace('{xp}', String(myRank.data.xp))}
          </p>
        </GlassCard>
      )}

      {isLoading && (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {!isLoading && podiumOrder.length > 0 && (
        <div className="mt-8 grid items-end gap-3 sm:grid-cols-3">
          {podiumOrder.map((row) => (
            <PodiumCard
              key={row.username}
              row={row}
              isYou={Boolean(user && (user.username === row.username || user.display_name === row.display_name))}
              tall={row.rank === 1}
            />
          ))}
        </div>
      )}

      {(isLoading || rest.length > 0) && (
        <GlassCard className="mt-6 overflow-hidden p-0">
          <div className="border-b border-[var(--border-default)] bg-[var(--bg-soft)] px-4 py-3 dark:bg-brand-950/30">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-800 dark:text-brand-200">
              {t('social.fullTable')}
            </p>
          </div>
          <ul className="divide-y divide-[var(--border-default)]">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="p-4">
                  <Skeleton className="h-10 w-full" />
                </li>
              ))}
            {rest.map((row) => {
              const isYou = Boolean(
                user && (user.username === row.username || user.display_name === row.display_name),
              )
              return (
                <li
                  key={`${row.rank}-${row.username}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 transition hover:bg-brand-50/60 dark:hover:bg-brand-500/5',
                    isYou && 'bg-brand-50/80 dark:bg-brand-500/10',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-muted)] font-mono text-sm font-bold text-[var(--text-secondary)]">
                    {row.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-[var(--text-primary)]">{row.display_name}</p>
                      {isYou && (
                        <span className="rounded-md bg-brand-600/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-800 dark:text-brand-200">
                          {t('social.you')}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                      @{row.username} · {row.level_title}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-success-500/12 px-2.5 py-1 text-sm font-bold tabular-nums text-success-700 dark:text-success-400">
                    <Zap className="h-3.5 w-3.5" />
                    {row.xp}
                  </span>
                </li>
              )
            })}
          </ul>
        </GlassCard>
      )}

      {!isLoading && data && data.length > 0 && data.length <= 3 && (
        <p className="text-muted mt-4 text-center text-sm">{t('social.climbHint')}</p>
      )}
    </div>
  )
}

export function AchievementsPage() {
  const t = useT()
  const { data, isLoading } = useQuery({ queryKey: ['achievements'], queryFn: api.achievements })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-page-title">{t('social.achievements')}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        {data?.map((a) => (
          <GlassCard key={a.id} className={a.unlocked ? '' : 'opacity-50 grayscale'}>
            <h3 className="font-semibold text-[var(--text-primary)]">{a.title}</h3>
            <p className="text-muted text-sm">{a.description}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

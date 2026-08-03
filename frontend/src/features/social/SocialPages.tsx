import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '@/shared/lib/api'
import { useT } from '@/shared/i18n'
import { GlassCard, Skeleton } from '@/shared/components/ui'

export function LeaderboardPage() {
  const t = useT()
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all')
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => api.leaderboard(period),
  })

  const periodLabel = {
    all: t('social.all'),
    week: t('social.week'),
    month: t('social.month'),
  } as const

  return (
    <div className="page-mesh mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-ink dark:text-white">{t('social.title')}</h1>
      <div className="mt-4 flex gap-2">
        {(['all', 'week', 'month'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-3 py-1 text-sm ${period === p ? 'bg-brand-600 text-white' : 'border'}`}
          >
            {periodLabel[p]}
          </button>
        ))}
      </div>
      <GlassCard className="mt-8 overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/50">
            <tr>
              <th className="p-3">{t('social.rank')}</th>
              <th className="p-3">{t('social.player')}</th>
              <th className="p-3">{t('social.xp')}</th>
              <th className="p-3">{t('social.level')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="p-3">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))}
            {data?.map((row) => (
              <tr key={row.rank} className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-3 font-mono">{row.rank}</td>
                <td className="p-3">{row.display_name}</td>
                <td className="p-3">{row.xp}</td>
                <td className="p-3">{row.level_title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}

export function AchievementsPage() {
  const t = useT()
  const { data, isLoading } = useQuery({ queryKey: ['achievements'], queryFn: api.achievements })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t('social.achievements')}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        {data?.map((a) => (
          <GlassCard key={a.id} className={a.unlocked ? '' : 'opacity-50 grayscale'}>
            <h3 className="font-semibold">{a.title}</h3>
            <p className="text-sm text-slate-500">{a.description}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

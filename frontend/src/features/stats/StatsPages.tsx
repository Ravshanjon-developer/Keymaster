import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { api } from '@/shared/lib/api'
import { useT } from '@/shared/i18n'
import { GlassCard, Skeleton } from '@/shared/components/ui'

export function StatsPage() {
  const t = useT()
  const { data, isLoading } = useQuery({ queryKey: ['stats'], queryFn: api.stats })

  const chartData = data
    ? [
        { name: t('stats.correct'), value: data.total_correct },
        { name: t('stats.wrong'), value: data.total_wrong },
      ]
    : []

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t('stats.title')}</h1>
      {isLoading && <Skeleton className="mt-8 h-64" />}
      {data && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <GlassCard>
              <p className="text-sm text-slate-500">{t('stats.learned')}</p>
              <p className="text-2xl font-bold">{data.combinations_learned}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-sm text-slate-500">{t('stats.accuracy')}</p>
              <p className="text-2xl font-bold">{data.accuracy}%</p>
            </GlassCard>
            <GlassCard>
              <p className="text-sm text-slate-500">{t('stats.streak')}</p>
              <p className="text-2xl font-bold">{data.streak_days}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-sm text-slate-500">{t('stats.avgResponse')}</p>
              <p className="text-2xl font-bold">{data.avg_response_ms} ms</p>
            </GlassCard>
            <GlassCard>
              <p className="text-sm text-slate-500">{t('stats.bestSpeed')}</p>
              <p className="text-2xl font-bold">{data.speed_best_score}</p>
            </GlassCard>
            <GlassCard>
              <p className="text-sm text-slate-500">{t('stats.bestExam')}</p>
              <p className="text-2xl font-bold">{data.exam_best_score}%</p>
            </GlassCard>
          </div>
          <GlassCard className="mt-8 h-72">
            <p className="mb-4 font-medium">{t('stats.answers')}</p>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </>
      )}
    </div>
  )
}

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Keyboard } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'
import { KeyboardTrainer } from '@/features/training/KeyboardTrainer'
import { useAuthStore } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { PageHeader, PageShell, SkeletonBlock } from '@/shared/components/PageLayout'
import { EmptyState, GlassCard, ProgressBar } from '@/shared/components/ui'

const NEXT_MS = 1200

export function TrainingPage() {
  const t = useT()
  const { localizeLesson } = useLocalizedContent()
  const [params] = useSearchParams()
  const course = params.get('course') ?? undefined
  const token = useAuthStore((s) => s.token)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['random', course],
    queryFn: () => api.randomLessons({ course_slug: course, limit: 50 }),
  })

  const [index, setIndex] = useState(0)
  const [waitingNext, setWaitingNext] = useState(false)
  const [lastKeys, setLastKeys] = useState<string[] | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const current = data?.[index]
  const currentLoc = current
    ? localizeLesson(current.course_slug ?? course, current.category_slug ?? undefined, current.keys, {
        title: current.title,
        action_prompt: current.action_prompt,
      })
    : null

  const progressPct = data?.length ? Math.round(((index + (waitingNext ? 1 : 0)) / data.length) * 100) : 0

  const next = useCallback(() => {
    setWaitingNext(false)
    setLastKeys(null)
    setCountdown(0)
    setIndex((i) => (data ? (i + 1) % data.length : 0))
  }, [data])

  useEffect(() => {
    if (!waitingNext) return
    const endAt = Date.now() + NEXT_MS
    setCountdown(Math.ceil(NEXT_MS / 1000))
    const tick = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)))
    }, 200)
    const done = window.setTimeout(() => next(), NEXT_MS)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [waitingNext, next])

  const onResult = useCallback(
    async (correct: boolean, ms: number) => {
      if (current && token && correct) {
        try {
          const result = await api.submitTraining({
            lesson_id: current.id,
            correct,
            response_time_ms: ms,
          })
          await refreshUser()
          await queryClient.invalidateQueries({ queryKey: ['course-progress'] })
          await queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
          if (result.xp_gained > 0) toast.success(t('training.xpGain', { n: result.xp_gained }))
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t('training.xpFail'))
        }
      }
      if (correct && current) {
        setSessionCorrect((n) => n + 1)
        setLastKeys(current.keys)
        setWaitingNext(true)
      }
    },
    [current, token, refreshUser, t, queryClient],
  )

  if (isLoading) {
    return (
      <PageShell width="2xl">
        <SkeletonBlock className="h-10 w-48" />
        <SkeletonBlock className="mt-6 h-64 w-full rounded-[var(--radius-card)]" />
      </PageShell>
    )
  }

  if (isError || !data?.length) {
    return (
      <PageShell width="2xl">
        <EmptyState icon={Keyboard} title={t('training.emptyTitle')} description={t('training.emptyDesc')} />
      </PageShell>
    )
  }

  return (
    <PageShell width="2xl">
      <PageHeader title={t('training.title')} subtitle={t('training.subtitle')} />

      <GlassCard className="mb-6 !p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-[var(--text-primary)]">
            {t('training.task', { n: index + 1, total: data.length })}
          </span>
          <span className="text-caption tabular-nums">
            {t('training.sessionCorrect', { n: sessionCorrect })}
          </span>
        </div>
        <ProgressBar value={progressPct} className="mt-3 h-2" />
      </GlassCard>

      <PracticeKeyboardGate courseQuery={course}>
        {current && currentLoc && !waitingNext && (
          <KeyboardTrainer
            key={current.id}
            mode="practice"
            title={t('training.task', { n: index + 1, total: data.length })}
            actionPrompt={currentLoc.action_prompt ?? current.action_prompt}
            keys={current.keys}
            onResult={onResult}
          />
        )}

        {waitingNext && current && currentLoc && (
          <GlassCard className="border-success-500/35 bg-gradient-to-br from-success-50/80 to-[var(--bg-elevated)] text-center dark:from-success-500/10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-500/15 text-success-700 dark:text-success-400">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-h3 text-success-800 dark:text-success-300">{t('training.correct')}</p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {currentLoc.action_prompt ?? current.action_prompt} ={' '}
              <strong className="font-mono">{formatShortcut(lastKeys ?? current.keys)}</strong>
            </p>
            <p className="mt-4 text-caption">{t('training.nextIn', { n: countdown })}</p>
            <button type="button" onClick={next} className="btn-primary mt-6">
              {t('training.next')}
            </button>
          </GlassCard>
        )}
      </PracticeKeyboardGate>
    </PageShell>
  )
}

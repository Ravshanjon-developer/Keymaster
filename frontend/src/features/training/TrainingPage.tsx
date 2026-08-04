import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { EmptyState, Skeleton } from '@/shared/components/ui'

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
  const current = data?.[index]
  const currentLoc = current
    ? localizeLesson(current.course_slug ?? course, current.category_slug ?? undefined, current.keys, {
        title: current.title,
        action_prompt: current.action_prompt,
      })
    : null

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
        setLastKeys(current.keys)
        setWaitingNext(true)
      }
    },
    [current, token, refreshUser, t, queryClient],
  )

  if (isLoading) return <Skeleton className="mx-auto mt-10 h-64 max-w-2xl" />
  if (isError || !data?.length) {
    return <EmptyState title={t('training.emptyTitle')} description={t('training.emptyDesc')} />
  }

  return (
    <div className="page-mesh mx-auto max-w-2xl px-4 py-10 pb-28 lg:pb-10">
      <h1 className="text-page-title">{t('training.title')}</h1>
      <p className="text-muted mt-2">{t('training.subtitle')}</p>

      <div className="mt-6">
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
          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center">
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{t('training.correct')}</p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {currentLoc.action_prompt ?? current.action_prompt} ={' '}
              <strong>{formatShortcut(lastKeys ?? current.keys)}</strong>
            </p>
            <p className="mt-4 text-sm text-slate-500">{t('training.nextIn', { n: countdown })}</p>
            <button
              type="button"
              onClick={next}
              className="mt-6 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white"
            >
              {t('training.next')}
            </button>
          </div>
          )}
        </PracticeKeyboardGate>
      </div>

      <p className="mt-4 text-center text-sm text-slate-500">
        {t('training.task', { n: index + 1, total: data.length })}
      </p>
    </div>
  )
}

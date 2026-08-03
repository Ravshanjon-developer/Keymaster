import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'

import { KeyboardTrainer } from '@/features/training/KeyboardTrainer'
import { useAuthStore } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { GlassCard, Skeleton } from '@/shared/components/ui'
import { formatDuration } from '@/shared/lib/utils'

const DURATION = 60

export function SpeedModePage() {
  const t = useT()
  const { localizeLesson } = useLocalizedContent()
  const { data, isLoading } = useQuery({
    queryKey: ['random-speed'],
    queryFn: () => api.randomLessons({ limit: 100 }),
  })
  const token = useAuthStore((s) => s.token)
  const refreshUser = useAuthStore((s) => s.refreshUser)

  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DURATION)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!started || finished) return
    if (timeLeft <= 0) {
      setFinished(true)
      return
    }
    const timer = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [started, timeLeft, finished])

  const current = data?.[index % (data?.length || 1)]
  const currentLoc = current
    ? localizeLesson(current.course_slug ?? undefined, current.category_slug ?? undefined, current.keys, {
        title: current.title,
        action_prompt: current.action_prompt,
      })
    : null

  const onResult = useCallback(
    async (ok: boolean, ms: number) => {
      setTotal((n) => n + 1)
      if (ok) {
        const add = 10 + combo * 2
        setScore((s) => s + add)
        setCorrect((c) => c + 1)
        setCombo((c) => {
          const n = c + 1
          setBestCombo((b) => Math.max(b, n))
          return n
        })
        if (current && token) {
          await api.submitTraining({ lesson_id: current.id, correct: true, response_time_ms: ms }).catch(() => {})
          await refreshUser()
        }
        setIndex((i) => i + 1)
      } else {
        setCombo(0)
      }
    },
    [combo, current, token, refreshUser],
  )

  if (isLoading) return <Skeleton className="mx-auto mt-10 h-64 max-w-2xl" />

  if (finished) {
    const accuracy = total ? Math.round((correct / total) * 100) : 0
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <GlassCard className="text-center">
          <motion.h2 initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-bold">
            {t('speed.timedOut')}
          </motion.h2>
          <dl className="mt-8 grid grid-cols-2 gap-4 text-left text-sm">
            <div>
              <dt className="text-slate-500">{t('speed.score')}</dt>
              <dd className="text-xl font-bold">{score}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('speed.bestCombo')}</dt>
              <dd className="text-xl font-bold">{bestCombo}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('speed.accuracy')}</dt>
              <dd className="text-xl font-bold">{accuracy}%</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('speed.correct')}</dt>
              <dd className="text-xl font-bold">
                {correct}/{total}
              </dd>
            </div>
          </dl>
          <button type="button" onClick={() => window.location.reload()} className="mt-8 rounded-xl bg-brand-600 px-6 py-2 text-white">
            {t('speed.again')}
          </button>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('speed.pageTitle')}</h1>
        {!started ? (
          <button type="button" onClick={() => setStarted(true)} className="rounded-xl bg-brand-600 px-4 py-2 text-white">
            {t('speed.start60')}
          </button>
        ) : (
          <div className="flex gap-4 text-sm font-medium">
            <span>⏱ {formatDuration(timeLeft)}</span>
            <span>⭐ {score}</span>
            <span>🔥 x{combo}</span>
          </div>
        )}
      </div>
      {started && current && currentLoc && (
        <KeyboardTrainer
          key={`${current.id}-${index}`}
          mode="practice"
          title={t('speed.title')}
          actionPrompt={currentLoc.action_prompt ?? current.action_prompt}
          keys={current.keys}
          onResult={onResult}
        />
      )}
    </div>
  )
}

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router'

import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'
import { KeyboardTrainer } from '@/features/training/KeyboardTrainer'
import { useAuthStore } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { LearnStatusBadge } from '@/shared/components/LearnStatus'
import { GlassCard, KeyCombo, Skeleton } from '@/shared/components/ui'

const NEXT_LESSON_MS = 1500

export function LessonPage({ lessonId }: { lessonId: string }) {
  const t = useT()
  const navigate = useNavigate()
  const { localizeLesson } = useLocalizedContent()
  const { data, isLoading } = useQuery({ queryKey: ['lesson', lessonId], queryFn: () => api.lesson(lessonId) })
  const token = useAuthStore((s) => s.token)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<'theory' | 'practice'>('theory')
  const [succeeded, setSucceeded] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const lessonProgress = useQuery({
    queryKey: ['lesson-progress-item', lessonId],
    queryFn: async () => {
      const rows = await api.lessonProgress({ lessonId })
      return rows[0] ?? null
    },
    enabled: !!token,
  })

  const courseQuery = useQuery({
    queryKey: ['course', data?.course_slug],
    queryFn: () => api.course(data!.course_slug!),
    enabled: !!data?.course_slug,
  })

  const nextLessonId = useMemo(() => {
    const cats = courseQuery.data?.categories
    if (!cats?.length) return null
    const flat = cats.flatMap((c) => c.lessons)
    const idx = flat.findIndex((l) => l.id === lessonId)
    if (idx < 0 || idx >= flat.length - 1) return null
    return flat[idx + 1]?.id ?? null
  }, [courseQuery.data, lessonId])

  const learned = useMemo(
    () => succeeded || Boolean(lessonProgress.data?.completed),
    [succeeded, lessonProgress.data?.completed],
  )

  useEffect(() => {
    setPhase('theory')
    setSucceeded(false)
    setCountdown(0)
  }, [lessonId])

  useEffect(() => {
    if (!succeeded || phase !== 'practice') return
    if (!nextLessonId) return
    const endAt = Date.now() + NEXT_LESSON_MS
    setCountdown(Math.ceil(NEXT_LESSON_MS / 1000))
    const tick = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)))
    }, 200)
    const done = window.setTimeout(() => {
      navigate(`/lessons/${nextLessonId}`)
    }, NEXT_LESSON_MS)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [succeeded, phase, nextLessonId, navigate])

  if (isLoading) return <Skeleton className="mx-auto mt-10 h-80 max-w-3xl" />
  if (!data) return null

  const loc = localizeLesson(data.course_slug ?? undefined, data.category_slug ?? undefined, data.keys, {
    title: data.title,
    action_prompt: data.action_prompt,
    usage_example: data.usage_example,
    description: data.description,
  })

  return (
    <div className="page-mesh mx-auto max-w-3xl px-4 py-10 pb-28 lg:pb-10">
      <GlassCard className={learned ? 'border-brand-600/30' : undefined}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-brand-600">{t('lesson.steps')}</p>
          {token ? (
            <LearnStatusBadge learned={learned} />
          ) : (
            <Link to="/login" className="text-xs font-semibold text-brand-700 hover:underline">
              {t('lesson.saveProgress')}
            </Link>
          )}
        </div>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink dark:text-white">{loc.title}</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">{loc.description}</p>

        <div className="mt-6 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800/80">
          <p className="text-sm font-medium text-slate-500">{t('lesson.action')}</p>
          <p className="mt-1 text-lg font-semibold">{loc.action_prompt}</p>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
            <p className="text-sm font-medium text-slate-500">{t('lesson.shortcut')}</p>
            {token && <LearnStatusBadge learned={learned} size="sm" />}
          </div>
          <KeyCombo keys={data.keys} learned={learned} />
          <p className="mt-4 text-center text-lg font-semibold tracking-wide">{formatShortcut(data.keys)}</p>
          {learned && (
            <p className="mt-2 text-center text-sm font-medium text-brand-700 dark:text-brand-300">
              {t('lesson.inArsenal')}
            </p>
          )}
        </div>

        <motion.div className="mt-6 rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-700">
          <strong>{t('lesson.why')}</strong> {loc.usage_example}
        </motion.div>

        {phase === 'theory' && (
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => {
                setSucceeded(false)
                setPhase('practice')
              }}
              className="btn-primary w-full py-3 text-base"
            >
              {learned ? t('lesson.repeat') : t('lesson.learn')}
            </button>
            <p className="text-center text-xs text-slate-500">{t('lesson.selfCheckHint')}</p>
          </div>
        )}
      </GlassCard>

      {phase === 'practice' && (
        <div className="mt-8 space-y-4">
          <PracticeKeyboardGate courseQuery={data.course_slug ?? undefined}>
            <KeyboardTrainer
            key={lessonId}
            title={t('lesson.learnMode')}
            mode="learn"
            actionPrompt={loc.action_prompt ?? data.action_prompt}
            keys={data.keys}
            onResult={async (correct, ms) => {
              if (!correct) return
              setSucceeded(true)
              if (token) {
                try {
                  const result = await api.submitTraining({
                    lesson_id: data.id,
                    correct,
                    response_time_ms: ms,
                  })
                  await refreshUser()
                  await queryClient.invalidateQueries({ queryKey: ['course-progress'] })
                  await queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
                  await queryClient.invalidateQueries({ queryKey: ['lesson-progress-item', lessonId] })
                  if (result.xp_gained > 0) toast.success(t('lesson.xpLearned', { n: result.xp_gained }))
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : t('lesson.xpFail'))
                }
              }
            }}
          />
          </PracticeKeyboardGate>

          {succeeded && (
            <GlassCard className="border-brand-600/30 bg-brand-50/50 dark:bg-brand-950/30">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-brand-800 dark:text-brand-200">{t('lesson.doneTitle')}</h2>
                <LearnStatusBadge learned />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t('lesson.rememberLine', {
                  shortcut: formatShortcut(data.keys),
                  prompt: loc.action_prompt ?? data.action_prompt,
                })}
              </p>
              {nextLessonId ? (
                <>
                  <p className="mt-3 text-sm text-slate-500">{t('lesson.nextLessonIn', { n: countdown })}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/lessons/${nextLessonId}`)}
                      className="btn-primary"
                    >
                      {t('lesson.nextLesson')}
                    </button>
                    <Link to="/training" className="btn-secondary">
                      {t('lesson.training')}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm text-slate-500">{t('lesson.courseFinished')}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link to="/training" className="btn-primary">
                      {t('lesson.training')}
                    </Link>
                    <Link to="/path" className="btn-secondary">
                      {t('lesson.path')}
                    </Link>
                    <Link to="/courses" className="btn-secondary">
                      {t('lesson.catalog')}
                    </Link>
                  </div>
                </>
              )}
            </GlassCard>
          )}

          <button
            type="button"
            onClick={() => {
              setPhase('theory')
              setSucceeded(false)
            }}
            className="text-sm text-slate-500 hover:text-brand-600"
          >
            {t('lesson.backTheory')}
          </button>
        </div>
      )}

      {phase === 'theory' && (
        <Link to="/courses" className="mt-6 inline-block text-sm text-brand-600">
          {t('lesson.backCatalog')}
        </Link>
      )}
    </div>
  )
}

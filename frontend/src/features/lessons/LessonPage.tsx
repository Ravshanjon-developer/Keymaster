import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'
import { TaskLessonPanel } from '@/features/lessons/TaskLessonPanel'
import { KeyboardTrainer } from '@/features/training/KeyboardTrainer'
import { useAuthStore } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { formatShortcut, isBrowserHostileForTraining } from '@/shared/lib/hotkeys'
import { useBlockBrowserChord } from '@/shared/hooks/useBlockBrowserChord'
import { isTaskLesson } from '@/shared/lib/lessonKind'
import { deriveTrainerCopy } from '@/shared/lib/lessonCopy'
import { parseTaskSteps } from '@/shared/lib/taskSteps'
import { desktopSimulatorHref, parseDesktopTaskId, DESKTOP_PROGRESS_EVENT, isDesktopTaskDoneLocally } from '@/shared/lib/simulatorProgress'
import { useT, useLocaleStore } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { LearnStatusBadge } from '@/shared/components/LearnStatus'
import { PracticeRegisterGate } from '@/shared/components/PracticeRegisterGate'
import { GlassCard, KeyCombo } from '@/shared/components/ui'
import { PageShell, SkeletonBlock } from '@/shared/components/PageLayout'

const NEXT_LESSON_MS = 1500

export function LessonPage({ lessonId }: { lessonId: string }) {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const navigate = useNavigate()
  const { localizeLesson } = useLocalizedContent()
  const { data, isLoading } = useQuery({ queryKey: ['lesson', lessonId], queryFn: () => api.lesson(lessonId) })
  const token = useAuthStore((s) => s.token)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const queryClient = useQueryClient()
  const [succeeded, setSucceeded] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const lessonProgress = useQuery({
    queryKey: ['lesson-progress-item', lessonId],
    queryFn: async () => {
      const rows = await api.lessonProgress({ lessonId })
      return rows[0] ?? null
    },
    enabled: !!token,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
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

  const desktopTaskId = data ? parseDesktopTaskId(data.keys) : null
  const localDesktopDone = desktopTaskId ? isDesktopTaskDoneLocally(desktopTaskId) : false

  const learned = useMemo(
    () =>
      succeeded ||
      Boolean(lessonProgress.data?.completed) ||
      localDesktopDone,
    [succeeded, lessonProgress.data?.completed, localDesktopDone],
  )

  useEffect(() => {
    setSucceeded(false)
    setCountdown(0)
  }, [lessonId])

  const taskModeLesson = data ? isTaskLesson(data.course_slug ?? undefined, data.keys) : false
  const studyOnly = Boolean(data && !taskModeLesson && isBrowserHostileForTraining(data.keys))
  const keyboardPractice = Boolean(data && !taskModeLesson && !studyOnly && token)

  // Sync desktop-sim completion as soon as localStorage / focus updates (no long wait).
  useEffect(() => {
    if (!token || !desktopTaskId) return

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['lesson-progress-item', lessonId] })
      void queryClient.invalidateQueries({ queryKey: ['lesson-progress'] })
      void queryClient.invalidateQueries({ queryKey: ['course-progress'] })
      // Force a re-render so isDesktopTaskDoneLocally() is read again.
      if (isDesktopTaskDoneLocally(desktopTaskId)) setSucceeded(true)
    }

    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ completed?: number[] }>).detail
      if (detail?.completed?.includes(desktopTaskId)) refresh()
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key && event.key !== 'km_desktop_tasks_v1') return
      refresh()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    refresh()
    window.addEventListener(DESKTOP_PROGRESS_EVENT, onProgress)
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisible)
    const poll = window.setInterval(() => {
      if (!lessonProgress.data?.completed) refresh()
    }, 1500)

    return () => {
      window.removeEventListener(DESKTOP_PROGRESS_EVENT, onProgress)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(poll)
    }
  }, [token, desktopTaskId, lessonId, queryClient, lessonProgress.data?.completed])

  // Block Ctrl+S / lesson chord so Chrome does not open “Save page as…” before the trainer is focused.
  useBlockBrowserChord(
    keyboardPractice ? data?.keys ?? null : null,
    keyboardPractice,
  )

  useEffect(() => {
    if (!succeeded) return
    // Desktop lessons: show «Следующий урок» immediately; user often stays in the sim queue.
    if (desktopTaskId) return
    if (!taskModeLesson && !studyOnly && !keyboardPractice) return
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
  }, [succeeded, taskModeLesson, studyOnly, keyboardPractice, desktopTaskId, nextLessonId, navigate])

  if (isLoading) {
    return (
      <PageShell width="3xl">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="mt-6 h-96 w-full rounded-[var(--radius-card)]" />
      </PageShell>
    )
  }
  if (!data) return null

  const loc = localizeLesson(data.course_slug ?? undefined, data.category_slug ?? undefined, data.keys, {
    title: data.title,
    action_prompt: data.action_prompt,
    usage_example: data.usage_example,
    description: data.description,
  })

  const taskSteps = parseTaskSteps(loc.usage_example ?? data.usage_example ?? '')
  const copy = deriveTrainerCopy({
    keys: data.keys,
    title: loc.title ?? data.title,
    action_prompt: loc.action_prompt ?? data.action_prompt,
    usage_example: loc.usage_example ?? data.usage_example,
    description: loc.description ?? data.description,
    locale,
  })

  const markTaskComplete = async () => {
    setSucceeded(true)
    if (!token) return
    try {
      const result = await api.submitTraining({
        lesson_id: data.id,
        correct: true,
        response_time_ms: 0,
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

  return (
    <PageShell width="3xl">
      {!keyboardPractice && (
      <GlassCard className={learned ? 'border-brand-600/30' : undefined}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {token ? <LearnStatusBadge learned={learned} /> : (
            <Link to="/register" state={{ from: `/lessons/${lessonId}` }} className="text-xs font-semibold text-brand-700 hover:underline">
              {t('lesson.saveProgress')}
            </Link>
          )}
        </div>
        <h1 className="font-display mt-1 text-3xl font-bold text-ink dark:text-white">{loc.title}</h1>
        {copy.why ? <p className="mt-3 text-slate-700 dark:text-slate-200">{copy.why}</p> : null}

        {!taskModeLesson && (
          <div className="mt-8">
            <KeyCombo keys={data.keys} learned={learned} />
            {learned && (
              <p className="mt-2 text-center text-sm font-medium text-brand-700 dark:text-brand-300">
                {t('lesson.inArsenal')}
              </p>
            )}
          </div>
        )}

        {taskModeLesson && (
          <div className="mt-6 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800/80">
            <p className="text-lg font-semibold">{loc.action_prompt}</p>
          </div>
        )}

        {taskModeLesson && (
          <div className="mt-8">
            {!token ? (
              <PracticeRegisterGate returnTo={`/lessons/${lessonId}`} />
            ) : (
              <TaskLessonPanel
                title={loc.title}
                actionPrompt={loc.action_prompt ?? data.action_prompt}
                steps={taskSteps}
                simulatorHref={desktopSimulatorHref(desktopTaskId, data.id)}
                requiresSimulator={desktopTaskId !== null}
                onComplete={() => void markTaskComplete()}
                completed={learned}
              />
            )}
          </div>
        )}

        {!taskModeLesson && studyOnly && (
          <div className="mt-8 space-y-3">
            <p className="text-center text-sm text-slate-600 dark:text-slate-300">
              {t('lesson.studyOnlyHint')}
            </p>
            {!token ? (
              <PracticeRegisterGate returnTo={`/lessons/${lessonId}`} />
            ) : (
              <>
                {!learned && (
                  <button
                    type="button"
                    onClick={() => void markTaskComplete()}
                    className="btn-primary w-full py-3 text-base"
                  >
                    {t('lesson.markLearned')}
                  </button>
                )}
                <Link
                  to={`/review?course=${encodeURIComponent(data.course_slug ?? 'programmer-basics')}`}
                  className="btn-secondary flex w-full justify-center py-3 text-base"
                >
                  {t('lesson.openReview')}
                </Link>
              </>
            )}
          </div>
        )}

        {!taskModeLesson && !studyOnly && !token && (
          <div className="mt-8">
            <PracticeRegisterGate returnTo={`/lessons/${lessonId}`} />
          </div>
        )}
      </GlassCard>
      )}

      {taskModeLesson && learned && token && (
        <GlassCard className="mt-8 border-brand-600/30 bg-brand-50/50 dark:bg-brand-950/30">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-brand-800 dark:text-brand-200">{t('lesson.doneTaskTitle')}</h2>
            <LearnStatusBadge learned />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {t('lesson.rememberTaskLine', { prompt: loc.action_prompt ?? data.action_prompt })}
          </p>
          {nextLessonId ? (
            <>
              <p className="mt-3 text-sm text-slate-500">{t('lesson.nextLessonIn', { n: countdown })}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate(`/lessons/${nextLessonId}`)} className="btn-primary">
                  {t('lesson.nextLesson')}
                </button>
                <Link to={desktopSimulatorHref(desktopTaskId, data.id)} className="btn-secondary">
                  {t('lesson.openDesktopSim')}
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/courses/computer-basics" className="btn-primary">
                {t('simulator.toCourse')}
              </Link>
              <Link to={desktopSimulatorHref(desktopTaskId, data.id)} className="btn-secondary">
                {t('lesson.openDesktopSim')}
              </Link>
            </div>
          )}
        </GlassCard>
      )}

      {keyboardPractice && (
        <div className="space-y-4 pb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <LearnStatusBadge learned={learned} />
          </div>
          <PracticeKeyboardGate courseQuery={data.course_slug ?? undefined}>
            <KeyboardTrainer
              key={lessonId}
              headline={copy.headline || loc.title}
              why={copy.why}
              detail={copy.detail}
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
        </div>
      )}

      <Link to="/courses" className="mt-6 inline-block text-sm text-brand-600">
        {t('lesson.backCatalog')}
      </Link>
    </PageShell>
  )
}

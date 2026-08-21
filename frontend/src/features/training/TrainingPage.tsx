import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Flame, Keyboard, PartyPopper } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'
import { KeyboardTrainer } from '@/features/training/KeyboardTrainer'
import { useAuthStore } from '@/features/auth/authStore'
import { api, type RandomLessonDto } from '@/shared/lib/api'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { deriveTrainerCopy } from '@/shared/lib/lessonCopy'
import { useBlockBrowserChord } from '@/shared/hooks/useBlockBrowserChord'
import { useT, useLocaleStore } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { PageShell, SkeletonBlock } from '@/shared/components/PageLayout'
import { EmptyState, GlassCard, KeyCombo, ProgressBar } from '@/shared/components/ui'

const NEXT_MS = 1600
const DEFAULT_COURSE = 'programmer-basics'
const WEAK_MISTAKE_THRESHOLD = 2
const RETRY_GAP = 4

type QueueItem = RandomLessonDto & { retry?: boolean }

export function TrainingPage() {
  const t = useT()
  const { localizeLesson } = useLocalizedContent()
  const [params] = useSearchParams()
  const course = params.get('course') ?? DEFAULT_COURSE
  const token = useAuthStore((s) => s.token)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['random', 'training', course],
    queryFn: () => api.randomLessons({ course_slug: course === 'all' ? undefined : course, limit: 50 }),
  })

  const [queue, setQueue] = useState<QueueItem[]>([])
  const [index, setIndex] = useState(0)
  const [waitingNext, setWaitingNext] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [finished, setFinished] = useState(false)
  /** lesson id → how much support this learner needed on it before */
  const [weak, setWeak] = useState<Record<string, true>>({})

  const startSession = useCallback((lessons: RandomLessonDto[]) => {
    setQueue(lessons.map((lesson) => ({ ...lesson })))
    setIndex(0)
    setWaitingNext(false)
    setSessionCorrect(0)
    setStreak(0)
    setFinished(false)
    setWeak({})
  }, [])

  useEffect(() => {
    if (!data?.length) return
    startSession(data)
  }, [data, startSession])

  const current = queue[index]
  const total = queue.length
  const currentLoc = current
    ? localizeLesson(current.course_slug ?? course, current.category_slug ?? undefined, current.keys, {
        title: current.title,
        action_prompt: current.action_prompt,
        usage_example: current.usage_example ?? undefined,
        description: current.description ?? undefined,
      })
    : null

  const progressPct = total ? Math.round(((index + (waitingNext ? 1 : 0)) / total) * 100) : 0

  useBlockBrowserChord(current?.keys ?? null, Boolean(current && !waitingNext && !finished))

  const locale = useLocaleStore((s) => s.locale)

  const copy = useMemo(() => {
    if (!current) return { headline: '', why: '', detail: '' }
    return deriveTrainerCopy({
      keys: current.keys,
      title: currentLoc?.title ?? current.title,
      action_prompt: currentLoc?.action_prompt ?? current.action_prompt,
      usage_example: currentLoc?.usage_example ?? current.usage_example,
      description: currentLoc?.description ?? current.description,
      locale,
    })
  }, [current, currentLoc, locale])

  const weakLessons = useMemo(
    () => queue.filter((lesson, i) => weak[lesson.id] && queue.findIndex((l) => l.id === lesson.id) === i),
    [queue, weak],
  )

  const advance = useCallback(() => {
    setWaitingNext(false)
    setCountdown(0)
    setIndex((i) => {
      if (i + 1 >= total) {
        setFinished(true)
        return i
      }
      return i + 1
    })
  }, [total])

  useEffect(() => {
    if (!waitingNext) return
    const endAt = Date.now() + NEXT_MS
    setCountdown(Math.ceil(NEXT_MS / 1000))
    const tick = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)))
    }, 200)
    const done = window.setTimeout(() => advance(), NEXT_MS)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [waitingNext, advance])

  /** Put a shaky combo back into the queue a few tasks later — spaced repetition, in-session. */
  const scheduleRetry = useCallback(
    (lesson: QueueItem) => {
      setWeak((w) => ({ ...w, [lesson.id]: true }))
      if (lesson.retry) return
      setQueue((q) => {
        const copyQ = [...q]
        copyQ.splice(Math.min(index + RETRY_GAP, copyQ.length), 0, { ...lesson, retry: true })
        return copyQ
      })
    },
    [index],
  )

  const onSkip = useCallback(() => {
    if (!current) return
    scheduleRetry(current)
    setStreak(0)
    toast(t('training.skipped'))
    advance()
  }, [advance, current, scheduleRetry, t])

  const onResult = useCallback(
    async (correct: boolean, ms: number, meta?: { mistakes: number; usedHint: boolean }) => {
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
        const struggled = (meta?.mistakes ?? 0) >= WEAK_MISTAKE_THRESHOLD || Boolean(meta?.usedHint)
        if (struggled) scheduleRetry(current)
        setSessionCorrect((n) => n + 1)
        setStreak((s) => {
          const nextStreak = s + 1
          setBestStreak((b) => Math.max(b, nextStreak))
          return nextStreak
        })
        setWaitingNext(true)
      } else {
        setStreak(0)
      }
    },
    [current, token, refreshUser, t, queryClient, scheduleRetry],
  )

  if (isLoading) {
    return (
      <PageShell width="2xl">
        <SkeletonBlock className="h-10 w-56" />
        <SkeletonBlock className="mt-6 h-72 w-full rounded-[var(--radius-card)]" />
      </PageShell>
    )
  }

  if (isError || !queue.length) {
    return (
      <PageShell width="2xl">
        <EmptyState icon={Keyboard} title={t('training.emptyTitle')} description={t('training.emptyDesc')} />
      </PageShell>
    )
  }

  if (finished) {
    return (
      <PageShell width="2xl">
        <h1 className="text-page-title">{t('training.title')}</h1>
        <GlassCard className="mt-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300">
            <PartyPopper className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-h3">{t('training.doneTitle')}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t('training.doneSummary', { done: sessionCorrect, total })}
          </p>
          {bestStreak > 1 ? (
            <p className="text-muted mt-1 text-xs">{t('training.bestStreak', { n: bestStreak })}</p>
          ) : null}

          {weakLessons.length ? (
            <div className="mt-6 text-left">
              <p className="mb-3 text-center text-sm font-semibold text-[var(--text-primary)]">
                {t('training.doneWeak')}
              </p>
              <ul className="space-y-2">
                {weakLessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] px-3 py-2"
                  >
                    <span className="text-sm text-[var(--text-primary)]">
                      {deriveTrainerCopy({ keys: lesson.keys, title: lesson.title, action_prompt: lesson.action_prompt }).headline}
                    </span>
                    <KeyCombo keys={lesson.keys} learned />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-success-700 dark:text-success-400">{t('training.doneAllGood')}</p>
          )}

          <button
            type="button"
            onClick={() => data && startSession(data)}
            className="btn-primary mt-6"
          >
            {t('training.restart')}
          </button>
        </GlassCard>
      </PageShell>
    )
  }

  return (
    <PageShell width="2xl">
      <header className="mb-5">
        <h1 className="text-page-title">{t('training.title')}</h1>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {t('training.task', { n: Math.min(index + 1, total), total })}
              {current?.retry ? (
                <span className="ml-2 text-xs font-medium text-brand-700 dark:text-brand-300">
                  {t('training.retryBadge')}
                </span>
              ) : null}
            </p>
            <ProgressBar value={progressPct} className="mt-2 h-2 w-48 max-w-full sm:w-64" />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-[var(--text-primary)]">
              <Flame className="h-4 w-4 text-orange-500" aria-hidden />
              {t('training.streak', { n: streak })}
            </span>
            <span className="text-caption tabular-nums">
              {t('training.sessionCorrect', { n: sessionCorrect })}
            </span>
          </div>
        </div>
      </header>

      <PracticeKeyboardGate courseQuery={course === 'all' ? undefined : course} allowVirtualKeys>
        {current && currentLoc && !waitingNext && (
          <KeyboardTrainer
            key={`${current.id}-${index}-${current.retry ? 'r' : 'n'}`}
            mode="practice"
            headline={copy.headline}
            why={copy.why}
            detail={copy.detail}
            actionPrompt={currentLoc.action_prompt ?? current.action_prompt}
            keys={current.keys}
            initialHintLevel={current.retry || weak[current.id] ? 1 : 0}
            onResult={onResult}
            onSkip={onSkip}
          />
        )}

        {waitingNext && current && (
          <GlassCard className="border-success-500/35 bg-gradient-to-br from-success-50/80 to-[var(--bg-elevated)] text-center dark:from-success-500/10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-500/15 text-success-700 dark:text-success-400">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-h3 text-success-800 dark:text-success-300">{t('training.correct')}</p>
            <p className="mt-3 font-mono text-lg font-bold tracking-wide">{formatShortcut(current.keys)}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{copy.headline}</p>
            {copy.detail ? (
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                {copy.detail}
              </p>
            ) : null}
            <button type="button" onClick={advance} className="btn-primary mt-5">
              {t('training.next')}
            </button>
            <p className="text-muted mt-3 text-xs">{t('training.nextIn', { n: countdown })}</p>
          </GlassCard>
        )}
      </PracticeKeyboardGate>
    </PageShell>
  )
}

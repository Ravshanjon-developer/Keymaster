import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { api, type RandomLessonDto } from '@/shared/lib/api'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { PageShell, SkeletonBlock } from '@/shared/components/PageLayout'
import { EmptyState, GlassCard, ProgressBar } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildOptions(correct: string, pool: RandomLessonDto[], lessonId: string): string[] {
  const wrong = pool
    .filter((l) => l.id !== lessonId)
    .map((l) => formatShortcut(l.keys))
    .filter((s) => s && s !== correct)
  const unique = [...new Set(wrong)]
  const picks = shuffle(unique).slice(0, 3)
  while (picks.length < 3) {
    picks.push(`Ctrl + ${String.fromCharCode(65 + picks.length)}`)
  }
  return shuffle([correct, ...picks.slice(0, 3)])
}

export function QuizPage() {
  const t = useT()
  const { localizeLesson } = useLocalizedContent()
  const [params] = useSearchParams()
  const course = params.get('course') ?? undefined

  const { data, isLoading, isError } = useQuery({
    queryKey: ['random', 'quiz', course],
    queryFn: () => api.randomLessons({ course_slug: course, limit: 35 }),
  })

  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const total = data?.length ?? 0
  const current = data?.[index]

  const options = useMemo(() => {
    if (!current || !data) return []
    const correct = formatShortcut(current.keys)
    return buildOptions(correct, data, current.id)
  }, [current, data])

  const loc = current
    ? localizeLesson(current.course_slug ?? course, current.category_slug ?? undefined, current.keys, {
        title: current.title,
        action_prompt: current.action_prompt,
      })
    : null

  const correctLabel = current ? formatShortcut(current.keys) : ''

  const onPick = useCallback(
    (label: string) => {
      if (picked || !current) return
      setPicked(label)
      const ok = label === correctLabel
      if (ok) {
        setScore((s) => s + 1)
        setStreak((s) => {
          const next = s + 1
          setBestStreak((b) => Math.max(b, next))
          return next
        })
      } else {
        setStreak(0)
      }
    },
    [picked, current, correctLabel],
  )

  const nextQuestion = useCallback(() => {
    if (index + 1 >= total) {
      setDone(true)
      return
    }
    setPicked(null)
    setIndex((i) => i + 1)
  }, [index, total])

  if (isLoading) {
    return (
      <PageShell width="2xl">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="mt-6 h-80 w-full rounded-[var(--radius-card)]" />
      </PageShell>
    )
  }
  if (isError || !data?.length) {
    return (
      <PageShell width="2xl">
        <EmptyState title={t('mobile.quizEmptyTitle')} description={t('mobile.quizEmptyDesc')} />
      </PageShell>
    )
  }

  if (done) {
    return (
      <div className="page-mesh mx-auto max-w-lg px-4 py-10 pb-28 text-center lg:pb-10">
        <GlassCard className="p-8">
          <h1 className="text-page-title">{t('mobile.quizDoneTitle')}</h1>
          <p className="mt-4 text-3xl font-bold text-brand-700 dark:text-brand-300">
            {t('mobile.quizScore', { score, total })}
          </p>
          <p className="text-muted mt-2">{t('mobile.quizBestStreak', { n: bestStreak })}</p>
          <button type="button" className="btn-primary mt-8 min-h-11 px-8" onClick={() => window.location.reload()}>
            {t('mobile.quizAgain')}
          </button>
        </GlassCard>
      </div>
    )
  }

  const progressPct = total ? Math.round(((index + (picked ? 1 : 0)) / total) * 100) : 0

  return (
    <div className="page-mesh mx-auto max-w-lg px-4 py-8 pb-28 lg:pb-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
        {t('mobile.quizEyebrow')}
      </p>
      <h1 className="text-page-title mt-1">{t('mobile.quizTitle')}</h1>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
        <GlassCard className="p-3">
          <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">{t('mobile.quizProgress')}</p>
          <p className="mt-1 font-bold tabular-nums">
            {index + 1}/{total}
          </p>
        </GlassCard>
        <GlassCard className="p-3">
          <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">{t('mobile.quizCorrect')}</p>
          <p className="mt-1 font-bold tabular-nums text-success-700 dark:text-success-400">{score}</p>
        </GlassCard>
        <GlassCard className="p-3">
          <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">{t('mobile.quizStreak')}</p>
          <p className="mt-1 font-bold tabular-nums text-accent-700 dark:text-accent-300">{streak}</p>
        </GlassCard>
      </div>

      <ProgressBar value={progressPct} className="mt-4" />

      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <GlassCard className="mt-6 p-5 sm:p-6">
              <p className="text-sm font-medium text-[var(--text-muted)]">{t('mobile.quizQuestion')}</p>
              <p className="mt-2 text-lg font-semibold leading-snug text-[var(--text-primary)]">
                {t('mobile.quizPrompt', { action: loc?.action_prompt ?? current.action_prompt })}
              </p>

              <ul className="mt-6 space-y-3">
                {options.map((opt) => {
                  const isPicked = picked === opt
                  const isCorrect = opt === correctLabel
                  let state: 'idle' | 'ok' | 'bad' = 'idle'
                  if (picked) {
                    if (isCorrect) state = 'ok'
                    else if (isPicked) state = 'bad'
                  }
                  return (
                    <li key={opt}>
                      <button
                        type="button"
                        disabled={Boolean(picked)}
                        onClick={() => onPick(opt)}
                        className={cn(
                          'flex min-h-11 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition duration-200 active:scale-[0.98]',
                          state === 'idle' &&
                            'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-brand-400/50',
                          state === 'ok' &&
                            'border-success-500 bg-success-500/15 text-success-800 dark:text-success-300',
                          state === 'bad' && 'border-signal bg-signal/10 text-signal',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                            state === 'ok' && 'border-success-600 bg-success-500',
                            state === 'bad' && 'border-signal bg-signal',
                            state === 'idle' && 'border-[var(--border-default)]',
                          )}
                          aria-hidden
                        />
                        <span className="font-mono">{opt}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {picked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-soft)] p-4 text-sm"
                >
                  <p className="font-semibold text-[var(--text-primary)]">
                    {picked === correctLabel ? t('mobile.quizExplainOk') : t('mobile.quizExplainBad')}
                  </p>
                  <p className="text-muted mt-2">
                    {loc?.usage_example ?? t('mobile.reviewNoExample')}
                  </p>
                  <button type="button" className="btn-primary mt-4 min-h-11 w-full sm:w-auto" onClick={nextQuestion}>
                    {index + 1 >= total ? t('mobile.quizFinish') : t('mobile.quizNext')}
                  </button>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

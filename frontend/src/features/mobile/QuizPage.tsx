import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { type RandomLessonDto } from '@/shared/lib/api'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { useLocaleStore, useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { PageShell, SkeletonBlock } from '@/shared/components/PageLayout'
import { EmptyState, GlassCard, ProgressBar } from '@/shared/components/ui'
import { explainShortcut } from '@/shared/lib/shortcutExplain'
import { parseDesktopTaskId } from '@/shared/lib/simulatorProgress'
import { fetchQuizLessons, quizContextKey } from '@/shared/lib/quizSession'
import { cn } from '@/shared/lib/utils'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Human label for a quiz choice — never raw `desktop:7`. */
function lessonChoiceLabel(lesson: RandomLessonDto): string {
  if (parseDesktopTaskId(lesson.keys)) {
    return (lesson.title || lesson.action_prompt || '').trim() || formatShortcut(lesson.keys)
  }
  return formatShortcut(lesson.keys)
}

function buildOptions(
  correct: string,
  pool: RandomLessonDto[],
  lessonId: string,
  courseSlug?: string | null,
): string[] {
  const scoped = courseSlug ? pool.filter((l) => l.course_slug === courseSlug) : pool
  const source = scoped.length >= 4 ? scoped : pool
  const wrong = source
    .filter((l) => l.id !== lessonId)
    .map((l) => lessonChoiceLabel(l))
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
  const locale = useLocaleStore((s) => s.locale)
  const { localizeLesson } = useLocalizedContent()
  const [params] = useSearchParams()
  const course = params.get('course') ?? undefined

  const { data, isLoading, isError } = useQuery({
    queryKey: ['random', 'quiz', 'v2', course ?? 'default'],
    queryFn: () => fetchQuizLessons(course),
  })

  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const total = data?.length ?? 0
  const current = data?.[index]

  const correctLabel = current ? lessonChoiceLabel(current) : ''

  const options = useMemo(() => {
    if (!current || !data) return []
    return buildOptions(correctLabel, data, current.id, current.course_slug)
  }, [current, data, correctLabel])

  const loc = current
    ? localizeLesson(current.course_slug ?? course, current.category_slug ?? undefined, current.keys, {
        title: current.title,
        action_prompt: current.action_prompt,
        usage_example: current.usage_example ?? undefined,
        description: current.description ?? undefined,
      })
    : null

  const tip = useMemo(() => {
    if (!current) return ''
    const fromSeed = (loc?.description || loc?.usage_example || '').trim()
    if (
      fromSeed &&
      fromSeed.length >= 12 &&
      !/^desktop:\d+$/i.test(fromSeed) &&
      fromSeed !== correctLabel &&
      !/это сочетание клавиш выполняет действие без мыши/i.test(fromSeed)
    ) {
      return fromSeed
    }
    const explained = explainShortcut(current.keys, locale, {
      title: loc?.title ?? current.title,
      description: loc?.description ?? current.description,
    })
    // Drop the long generic fallback — keep a short useful line.
    const generic = /это сочетание клавиш выполняет действие без мыши|ин клавишаҳо амалро бе муш/i
    if (generic.test(explained)) {
      const title = (loc?.title ?? current.title ?? '').trim()
      return title || explained.split('.')[0] || explained
    }
    return explained
  }, [current, loc, locale, correctLabel])

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

  useEffect(() => {
    if (!picked) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable) {
        return
      }
      // `>` / Period / ArrowRight / Enter → same as «Дальше»
      if (e.key === '>' || e.key === '.' || e.code === 'Period' || e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        nextQuestion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked, nextQuestion])

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
  const answerOk = picked === correctLabel

  return (
    <div className="page-mesh relative mx-auto max-w-lg px-4 py-8 pb-28 lg:pb-10">
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

      {/* Outside the question card: compact top-right feedback */}
      <AnimatePresence>
        {picked && current ? (
          <motion.aside
            key={`feedback-${current.id}`}
            initial={{ opacity: 0, y: -8, x: 8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -6, x: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={cn(
              'mt-4 ml-auto w-full max-w-xs rounded-xl border px-3 py-2.5',
              'shadow-[0_14px_40px_-22px_rgba(0,0,0,0.6)] backdrop-blur-md',
              'lg:fixed lg:right-6 lg:top-24 lg:z-40 lg:mt-0',
              answerOk ? 'border-emerald-500/40 bg-[var(--bg-elevated)]/95' : 'border-rose-500/40 bg-[var(--bg-elevated)]/95',
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              {answerOk ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
              )}
              <p
                className={cn(
                  'text-sm font-bold',
                  answerOk ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300',
                )}
              >
                {answerOk ? t('mobile.quizExplainOk') : t('mobile.quizExplainBad')}
              </p>
              <span className="ml-auto font-mono text-xs font-bold text-[var(--text-primary)]">{correctLabel}</span>
            </div>

            {tip ? (
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-[var(--text-secondary)]">{tip}</p>
            ) : null}

            <button
              type="button"
              className="btn-primary mt-2.5 min-h-8 w-full px-3 text-[13px]"
              onClick={nextQuestion}
            >
              {index + 1 >= total ? t('mobile.quizFinish') : `${t('mobile.quizNext')} ›`}
            </button>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <GlassCard className="mt-4 p-5 sm:p-6 lg:mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[var(--text-muted)]">{t('mobile.quizQuestion')}</p>
                {current.course_slug ? (
                  <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-800 dark:text-brand-300">
                    {t(`mobile.${quizContextKey(current.course_slug)}`)}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-lg font-semibold leading-snug text-[var(--text-primary)]">
                {t('mobile.quizPrompt', {
                  context: t(`mobile.${quizContextKey(current.course_slug)}`),
                  action: loc?.action_prompt ?? current.action_prompt,
                })}
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
                        <span className={/\+/.test(opt) || /^(Ctrl|Alt|Shift|Win|F\d)/i.test(opt) ? 'font-mono' : ''}>
                          {opt}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

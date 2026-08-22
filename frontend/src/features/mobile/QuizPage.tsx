import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useLocaleStore, useT } from '@/shared/i18n'
import { GlassCard, ProgressBar } from '@/shared/components/ui'
import { getHotkeysQuiz, QUIZ_XP_PER_CORRECT } from '@/shared/lib/quizBank'
import { cn } from '@/shared/lib/utils'

export function QuizPage() {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)

  const questions = useMemo(() => getHotkeysQuiz(locale), [locale])
  const total = questions.length

  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const streakRef = useRef(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const current = questions[index]
  const correctLabel = current?.correctAnswer ?? ''
  const options = current?.options ?? []
  const tip = current?.explanation ?? ''

  const onPick = useCallback(
    (label: string) => {
      if (picked || !current) return
      setPicked(label)
      const ok = label === correctLabel
      if (ok) {
        setScore((s) => s + 1)
        setXp((x) => x + QUIZ_XP_PER_CORRECT)
        streakRef.current += 1
        setBestStreak((b) => Math.max(b, streakRef.current))
      } else {
        streakRef.current = 0
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
      if (e.key === '>' || e.key === '.' || e.code === 'Period' || e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        nextQuestion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picked, nextQuestion])

  if (done) {
    return (
      <div className="page-mesh mx-auto max-w-lg px-4 py-10 pb-28 text-center lg:pb-10">
        <GlassCard className="p-8">
          <h1 className="text-page-title">{t('mobile.quizDoneTitle')}</h1>
          <p className="mt-4 text-3xl font-bold text-brand-700 dark:text-brand-300">
            {t('mobile.quizScore', { score, total })}
          </p>
          <p className="text-muted mt-2">{t('mobile.quizTotalXp', { n: xp })}</p>
          <p className="text-muted mt-1">{t('mobile.quizBestStreak', { n: bestStreak })}</p>
          <button type="button" className="btn-primary mt-8 min-h-11 px-8" onClick={() => window.location.reload()}>
            {t('mobile.quizAgain')}
          </button>
        </GlassCard>
      </div>
    )
  }

  const progressPct = total ? Math.round(((index + (picked ? 1 : 0)) / total) * 100) : 0
  const answerOk = picked === correctLabel
  const levelLabel = current?.level === 'practical' ? t('mobile.quizLevelPractical') : t('mobile.quizLevelBasic')

  return (
    <div className="page-mesh relative mx-auto max-w-lg px-4 py-8 pb-28 lg:pb-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
        {t('mobile.quizEyebrow')}
      </p>
      <h1 className="text-page-title mt-1">{t('mobile.quizTitle')}</h1>
      <p className="text-muted mt-1 text-sm">{t('mobile.quizSubtitle')}</p>

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
          <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">{t('mobile.quizXp')}</p>
          <p className="mt-1 font-bold tabular-nums text-accent-700 dark:text-accent-300">{xp}</p>
        </GlassCard>
      </div>

      <ProgressBar value={progressPct} className="mt-4" />

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
              {answerOk ? (
                <span className="ml-auto text-xs font-bold text-accent-700 dark:text-accent-300">
                  {t('mobile.quizXpGain', { n: QUIZ_XP_PER_CORRECT })}
                </span>
              ) : (
                <span className="ml-auto font-mono text-xs font-bold text-[var(--text-primary)]">{correctLabel}</span>
              )}
            </div>

            {!answerOk && tip ? (
              <p className="mt-1.5 line-clamp-3 text-[12px] leading-snug text-[var(--text-secondary)]">{tip}</p>
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
                <p className="text-sm font-medium text-[var(--text-muted)]">
                  {t('mobile.quizQuestion')} {current.id}
                </p>
                <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-800 dark:text-brand-300">
                  {levelLabel}
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold leading-snug text-[var(--text-primary)]">{current.question}</p>

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
                          opt.length > 40 && 'text-[13px] leading-snug',
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
                        <span className={/\+/.test(opt) || /^(Ctrl|Alt|Shift|Win|F\d|Print)/i.test(opt) ? 'font-mono' : ''}>
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

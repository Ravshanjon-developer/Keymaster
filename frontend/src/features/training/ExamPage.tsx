import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'

import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'
import { useAuthStore } from '@/features/auth/authStore'
import { KeyboardTrainer } from '@/features/training/KeyboardTrainer'
import { GlassCard, KeyCombo, Skeleton } from '@/shared/components/ui'
import { api } from '@/shared/lib/api'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { cn, formatDuration } from '@/shared/lib/utils'

const FEEDBACK_MS = 2800
const QUESTION_OPTIONS = [10, 20, 30, 50] as const
const MINUTE_OPTIONS = [5, 10, 15, 20] as const

type Phase = 'setup' | 'run' | 'done'

type ExamConfig = {
  courseSlug?: string
  questions: number
  minutes: number
}

export function ExamPage() {
  const t = useT()
  const { localizeCourse, localizeLesson } = useLocalizedContent()
  const [params] = useSearchParams()
  const presetCourse = params.get('course') ?? undefined
  const token = useAuthStore((s) => s.token)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const queryClient = useQueryClient()

  const courses = useQuery({ queryKey: ['courses'], queryFn: api.courses })

  const [phase, setPhase] = useState<Phase>('setup')
  const [config, setConfig] = useState<ExamConfig>({
    courseSlug: presetCourse,
    questions: 20,
    minutes: 10,
  })

  const [index, setIndex] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [right, setRight] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [endsAt, setEndsAt] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [feedback, setFeedback] = useState<{
    ok: boolean
    prompt: string
    keys: string[]
  } | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [timedOut, setTimedOut] = useState(false)

  const examQuery = useQuery({
    queryKey: ['exam', config.courseSlug, config.questions, phase === 'run' || phase === 'done'],
    queryFn: () =>
      api.randomLessons({
        course_slug: config.courseSlug,
        limit: config.questions,
      }),
    enabled: phase === 'run' || phase === 'done',
  })

  const total = examQuery.data?.length ?? config.questions
  const current = examQuery.data?.[index]
  const currentLoc = current
    ? localizeLesson(
        current.course_slug ?? config.courseSlug,
        current.category_slug ?? undefined,
        current.keys,
        { title: current.title, action_prompt: current.action_prompt },
      )
    : null

  const secPerQuestion = useMemo(
    () => Math.round((config.minutes * 60) / config.questions),
    [config.minutes, config.questions],
  )

  const finish = useCallback((byTimeout = false) => {
    setTimedOut(byTimeout)
    setFeedback(null)
    setPhase('done')
  }, [])

  const goNext = useCallback(() => {
    setFeedback(null)
    setCountdown(0)
    if (index + 1 >= total) finish(false)
    else setIndex((i) => i + 1)
  }, [index, total, finish])

  const onResult = useCallback(
    async (ok: boolean, ms: number) => {
      if (!current || feedback || phase !== 'run') return
      if (ok) setRight((r) => r + 1)
      else setWrong((w) => w + 1)
      const loc = localizeLesson(
        current.course_slug ?? config.courseSlug,
        current.category_slug ?? undefined,
        current.keys,
        { title: current.title, action_prompt: current.action_prompt },
      )
      setFeedback({
        ok,
        prompt: loc.action_prompt ?? current.action_prompt,
        keys: current.keys,
      })
      setCountdown(Math.ceil(FEEDBACK_MS / 1000))
      if (token) {
        try {
          const result = await api.submitTraining({
            lesson_id: current.id,
            correct: ok,
            response_time_ms: ms,
          })
          await refreshUser()
          await queryClient.invalidateQueries({ queryKey: ['course-progress'] })
          if (ok && result.xp_gained > 0) toast.success(t('exam.xpGain', { n: result.xp_gained }))
        } catch {
          /* keep exam flowing */
        }
      }
    },
    [current, feedback, phase, token, refreshUser, t, localizeLesson, config.courseSlug, queryClient],
  )

  useEffect(() => {
    if (phase !== 'run' || !endsAt) return
    const tick = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setTimeLeft(left)
      if (left <= 0) {
        window.clearInterval(tick)
        finish(true)
      }
    }, 200)
    return () => window.clearInterval(tick)
  }, [phase, endsAt, finish])

  useEffect(() => {
    if (!feedback || phase !== 'run') return
    const endAt = Date.now() + FEEDBACK_MS
    const tick = window.setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((endAt - Date.now()) / 1000)))
    }, 200)
    const done = window.setTimeout(() => goNext(), FEEDBACK_MS)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(done)
    }
  }, [feedback, goNext, phase])

  function startExam() {
    const now = Date.now()
    setIndex(0)
    setWrong(0)
    setRight(0)
    setFeedback(null)
    setTimedOut(false)
    setStartedAt(now)
    setEndsAt(now + config.minutes * 60 * 1000)
    setTimeLeft(config.minutes * 60)
    setPhase('run')
  }

  if (phase === 'setup') {
    return (
      <div className="page-mesh mx-auto max-w-xl px-4 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
          {t('exam.setupEyebrow')}
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold text-ink dark:text-white">{t('exam.setupTitle')}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{t('exam.setupSub')}</p>

        <GlassCard className="mt-8 space-y-6 p-6">
          <fieldset>
            <legend className="text-sm font-semibold text-ink dark:text-white">{t('exam.course')}</legend>
            {courses.isLoading ? (
              <Skeleton className="mt-2 h-11 w-full" />
            ) : (
              <select
                className="input-field"
                value={config.courseSlug ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    courseSlug: e.target.value || undefined,
                  }))
                }
              >
                <option value="">{t('exam.allCourses')}</option>
                {courses.data?.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {localizeCourse(c.slug, c.title, c.description).title}
                  </option>
                ))}
              </select>
            )}
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t('exam.questions')}</legend>
            <div className="flex flex-wrap gap-2">
              {QUESTION_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, questions: n }))}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-sm font-semibold transition',
                    config.questions === n
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-ink/12 bg-white hover:border-brand-600/40 dark:border-white/15 dark:bg-slate-900',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t('exam.timeLimit')}</legend>
            <div className="flex flex-wrap gap-2">
              {MINUTE_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, minutes: m }))}
                  className={cn(
                    'rounded-xl border px-4 py-2 text-sm font-semibold transition',
                    config.minutes === m
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-ink/12 bg-white hover:border-brand-600/40 dark:border-white/15 dark:bg-slate-900',
                  )}
                >
                  {t('exam.minutes', { n: m })}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="rounded-xl border border-ink/8 bg-paper/80 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
            {t('exam.perQuestion', {
              sec: secPerQuestion,
              questions: config.questions,
              minutes: config.minutes,
            })}
            {config.courseSlug
              ? ` · ${(() => {
                  const c = courses.data?.find((x) => x.slug === config.courseSlug)
                  return c
                    ? localizeCourse(c.slug, c.title, c.description).title
                    : config.courseSlug
                })()}`
              : ` · ${t('exam.mixed')}`}
          </div>

          <button type="button" onClick={startExam} className="btn-primary w-full py-3 text-base">
            {t('exam.start')}
          </button>
        </GlassCard>
      </div>
    )
  }

  if (phase === 'run' && examQuery.isLoading) {
    return <Skeleton className="mx-auto mt-16 h-64 max-w-2xl" />
  }

  if (phase === 'run' && !examQuery.data?.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <GlassCard>
          <h2 className="text-xl font-bold">{t('exam.noQuestions')}</h2>
          <p className="mt-2 text-sm text-slate-500">{t('exam.noQuestionsHint')}</p>
          <button type="button" className="btn-primary mt-6" onClick={() => setPhase('setup')}>
            {t('exam.backSetup')}
          </button>
        </GlassCard>
      </div>
    )
  }

  if (phase === 'done') {
    const answered = right + wrong
    const percent = answered ? Math.round((right / answered) * 100) : 0
    const duration = Math.round((Date.now() - startedAt) / 1000)
    const grade = percent >= 90 ? 'A' : percent >= 75 ? 'B' : percent >= 60 ? 'C' : 'D'
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <GlassCard>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
            {t('exam.results')}
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold">
            {timedOut ? t('exam.timedOut') : t('exam.finished')}
          </h2>
          <ul className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              {t('exam.result')}: <strong className="text-ink dark:text-white">{percent}%</strong>
            </li>
            <li>
              {t('exam.summaryLine', {
                right: t('exam.right'),
                ok: right,
                wrong: t('exam.wrong'),
                bad: wrong,
                answered: t('exam.answered'),
                done: answered,
                total,
              })}
            </li>
            <li>
              {t('exam.time')}: {formatDuration(duration)} / {t('exam.minutes', { n: config.minutes })}
            </li>
            <li>
              {t('exam.grade')}: {grade}
            </li>
          </ul>
          {percent >= 90 && <CertificateCard name="KeyMaster" percent={percent} />}
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => setPhase('setup')}>
              {t('exam.newExam')}
            </button>
            <Link to="/path" className="btn-secondary">
              {t('exam.toPath')}
            </Link>
          </div>
        </GlassCard>
      </div>
    )
  }

  const urgent = timeLeft <= 60

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-28 lg:pb-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {t('exam.runningLabel', { n: index + 1, total })}
          {config.courseSlug ? ` · ${config.courseSlug}` : ''}
        </p>
        <div
          className={cn(
            'rounded-xl px-3 py-1.5 font-mono text-sm font-bold tabular-nums',
            urgent
              ? 'bg-signal/15 text-signal'
              : 'bg-ink/5 text-ink dark:bg-white/10 dark:text-slate-100',
          )}
        >
          {formatDuration(timeLeft)}
        </div>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300"
          style={{ width: `${((index + (feedback ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      {feedback ? (
        <div
          className={cn(
            'rounded-3xl border p-8 text-center',
            feedback.ok
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-signal/40 bg-signal/10',
          )}
        >
          <p className={cn('text-2xl font-bold', feedback.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-signal')}>
            {feedback.ok ? t('exam.ok') : t('exam.bad')}
          </p>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{feedback.prompt}</p>
          <p className="mt-6 text-sm font-medium text-slate-500">{t('exam.correctCombo')}</p>
          <div className="mt-3">
            <KeyCombo keys={feedback.keys} />
          </div>
          <p className="mt-4 font-mono text-lg font-semibold">{formatShortcut(feedback.keys)}</p>
          <p className="mt-6 text-sm text-slate-500">{t('exam.nextIn', { n: countdown || 1 })}</p>
          <button type="button" onClick={goNext} className="mt-4 text-sm font-semibold text-brand-700 hover:underline">
            {t('exam.skipWait')}
          </button>
        </div>
      ) : (
        current && currentLoc && (
          <PracticeKeyboardGate courseQuery={config.courseSlug}>
            <KeyboardTrainer
              key={current.id}
              mode="exam"
              title={t('exam.question', { n: index + 1 })}
              actionPrompt={currentLoc.action_prompt ?? current.action_prompt}
              keys={current.keys}
              onResult={(ok, ms) => void onResult(ok, ms)}
            />
          </PracticeKeyboardGate>
        )
      )}
    </div>
  )
}

function CertificateCard({ name, percent }: { name: string; percent: number }) {
  const t = useT()
  return (
    <div className="mt-8 rounded-2xl border border-brand-600/30 bg-gradient-to-br from-brand-50 to-white p-6 text-center dark:from-brand-950/50 dark:to-slate-900">
      <p className="text-sm uppercase tracking-widest text-brand-700 dark:text-brand-300">{t('exam.certificate')}</p>
      <p className="font-display mt-2 text-lg font-bold">{name}</p>
      <p className="text-sm text-slate-600 dark:text-slate-300">{t('exam.certificateText', { percent })}</p>
    </div>
  )
}

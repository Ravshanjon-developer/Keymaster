import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Award, CheckCircle2, Gauge, Info, ListChecks, Timer, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useSearchParams } from 'react-router-dom'

import { PracticeKeyboardGate } from '@/features/mobile/PracticeKeyboardGate'
import { useAuthStore } from '@/features/auth/authStore'
import { KeyboardTrainer } from '@/features/training/KeyboardTrainer'
import { Button, GlassCard, KeyCombo, ProgressBar, Skeleton, StatusBadge } from '@/shared/components/ui'
import { api } from '@/shared/lib/api'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { cn, formatDuration } from '@/shared/lib/utils'

const FEEDBACK_MS = 2800
const QUESTION_OPTIONS = [10, 20, 30, 50] as const
const MINUTE_OPTIONS = [5, 10, 15, 20] as const

/** Below this many seconds per question the session feels rushed. */
const PACE_FAST_SEC = 15
/** Above this the session is generous enough to think between answers. */
const PACE_RELAXED_SEC = 45

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
  /** Bumped on every start so a repeat session pulls a fresh question set. */
  const [sessionId, setSessionId] = useState(0)

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

  const selectedCourse = courses.data?.find((c) => c.slug === config.courseSlug)
  const courseLabel = selectedCourse
    ? localizeCourse(selectedCourse.slug, selectedCourse.title, selectedCourse.description).title
    : t('exam.mixed')

  /** A course can hold fewer lessons than the requested question count. */
  const availableQuestions = selectedCourse?.lesson_count ?? null
  const askedQuestions = availableQuestions
    ? Math.min(config.questions, availableQuestions)
    : config.questions
  const isCapped = askedQuestions < config.questions
  /** Greying out sizes only helps while at least one of them is still reachable. */
  const canDisableSizes = Boolean(availableQuestions && availableQuestions >= QUESTION_OPTIONS[0])

  const examQuery = useQuery({
    queryKey: ['exam', sessionId, config.courseSlug, askedQuestions],
    queryFn: () =>
      api.randomLessons({
        course_slug: config.courseSlug,
        limit: askedQuestions,
        // Desktop simulator tasks cannot be answered on a keyboard trainer.
        hotkeys_only: true,
      }),
    enabled: sessionId > 0 && (phase === 'run' || phase === 'done'),
    staleTime: 0,
    gcTime: 0,
  })

  const total = examQuery.data?.length ?? askedQuestions
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
    () => Math.max(1, Math.round((config.minutes * 60) / askedQuestions)),
    [config.minutes, askedQuestions],
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
    setSessionId((id) => id + 1)
    setPhase('run')
  }

  if (phase === 'setup') {
    const paceTone = secPerQuestion < PACE_FAST_SEC ? 'warning' : 'info'
    const paceText =
      secPerQuestion < PACE_FAST_SEC
        ? t('exam.paceFast', { n: secPerQuestion })
        : secPerQuestion > PACE_RELAXED_SEC
          ? t('exam.paceRelaxed', { n: secPerQuestion })
          : t('exam.paceBalanced')

    return (
      <div className="page-mesh mx-auto max-w-xl px-4 py-12 pb-28 lg:pb-12">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
          {t('exam.setupEyebrow')}
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold text-ink dark:text-white">{t('exam.setupTitle')}</h1>
        <p className="text-muted mt-2">{t('exam.setupSub')}</p>

        <GlassCard className="mt-8 space-y-6 p-6">
          <fieldset>
            <legend className="text-sm font-semibold text-ink dark:text-white">{t('exam.course')}</legend>
            {courses.isLoading ? (
              <Skeleton className="mt-2 h-11 w-full rounded-xl" />
            ) : (
              <>
                <select
                  className="input-field mt-2"
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
                {availableQuestions ? (
                  <p className="text-muted mt-2 text-xs">
                    {t('exam.availableCount', { n: availableQuestions })}
                  </p>
                ) : null}
              </>
            )}
          </fieldset>

          <OptionGroup label={t('exam.questions')}>
            {QUESTION_OPTIONS.map((n) => (
              <OptionChip
                key={n}
                selected={config.questions === n}
                disabled={canDisableSizes && n > (availableQuestions ?? n)}
                onClick={() => setConfig((c) => ({ ...c, questions: n }))}
              >
                {n}
              </OptionChip>
            ))}
          </OptionGroup>

          <OptionGroup label={t('exam.timeLimit')}>
            {MINUTE_OPTIONS.map((m) => (
              <OptionChip
                key={m}
                selected={config.minutes === m}
                onClick={() => setConfig((c) => ({ ...c, minutes: m }))}
              >
                {t('exam.minutes', { n: m })}
              </OptionChip>
            ))}
          </OptionGroup>

          <section
            aria-label={t('exam.summaryTitle')}
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-soft)] p-4"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t('exam.summaryTitle')}
            </p>

            <dl className="mt-3 grid grid-cols-3 gap-3">
              <SummaryMetric
                icon={ListChecks}
                label={t('exam.questions')}
                value={String(askedQuestions)}
              />
              <SummaryMetric
                icon={Timer}
                label={t('exam.timeLimit')}
                value={t('exam.minutes', { n: config.minutes })}
              />
              <SummaryMetric
                icon={Gauge}
                label={t('exam.pace')}
                value={t('exam.paceValue', { n: secPerQuestion })}
              />
            </dl>

            <div className="mt-4">
              <StatusBadge tone={config.courseSlug ? 'brand' : 'neutral'}>{courseLabel}</StatusBadge>
            </div>

            <div className="mt-3 space-y-1.5">
              {isCapped ? (
                <SetupHint tone="warning">{t('exam.cappedNotice', { n: askedQuestions })}</SetupHint>
              ) : null}
              <SetupHint tone={paceTone}>{paceText}</SetupHint>
            </div>
          </section>

          <Button size="lg" className="w-full" onClick={startExam} disabled={courses.isLoading}>
            {t('exam.start')}
          </Button>
        </GlassCard>
      </div>
    )
  }

  if (phase === 'run' && examQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
        <Skeleton className="mt-6 h-64 w-full rounded-[var(--radius-card)]" />
      </div>
    )
  }

  if (phase === 'run' && !examQuery.data?.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <GlassCard>
          <h2 className="text-xl font-bold">{t('exam.noQuestions')}</h2>
          <p className="text-muted mt-2 text-sm">{t('exam.noQuestionsHint')}</p>
          <Button className="mt-6" onClick={() => setPhase('setup')}>
            {t('exam.backSetup')}
          </Button>
        </GlassCard>
      </div>
    )
  }

  if (phase === 'done') {
    const answered = right + wrong
    const unanswered = Math.max(0, total - answered)
    // Score counts every question of the session — skipped ones included.
    const percent = total ? Math.round((right / total) * 100) : 0
    const accuracy = answered ? Math.round((right / answered) * 100) : 0
    const duration = Math.round((Date.now() - startedAt) / 1000)
    const grade = percent >= 90 ? 'A' : percent >= 75 ? 'B' : percent >= 60 ? 'C' : 'D'
    const gradeText =
      grade === 'A'
        ? t('exam.gradeExcellent')
        : grade === 'B'
          ? t('exam.gradeGood')
          : grade === 'C'
            ? t('exam.gradeOk')
            : t('exam.gradeWeak')
    const gradeTone = grade === 'A' || grade === 'B' ? 'success' : grade === 'C' ? 'warning' : 'neutral'

    return (
      <div className="mx-auto max-w-lg px-4 py-16 pb-28 lg:pb-16">
        <GlassCard>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
            {t('exam.results')}
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold">
            {timedOut ? t('exam.timedOut') : t('exam.finished')}
          </h2>

          <div className="mt-6 flex items-center gap-4">
            <div
              className={cn(
                'flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border-2 text-2xl font-bold',
                gradeTone === 'success' && 'border-success-500 text-success-700 dark:text-success-400',
                gradeTone === 'warning' && 'border-amber-500 text-amber-700 dark:text-amber-300',
                gradeTone === 'neutral' && 'border-[var(--border-default)] text-[var(--text-secondary)]',
              )}
              aria-hidden
            >
              {grade}
            </div>
            <div className="min-w-0">
              <p className="text-3xl font-bold tabular-nums text-ink dark:text-white">{percent}%</p>
              <p className="text-muted text-sm">{gradeText}</p>
            </div>
          </div>

          <ProgressBar
            value={percent}
            className="mt-4"
            barClassName={gradeTone === 'success' ? 'bg-success-500' : undefined}
          />

          <dl className="mt-6 grid grid-cols-2 gap-3">
            <ResultStat icon={CheckCircle2} label={t('exam.right')} value={String(right)} tone="success" />
            <ResultStat icon={XCircle} label={t('exam.wrong')} value={String(wrong)} tone="danger" />
            <ResultStat icon={Gauge} label={t('exam.accuracy')} value={`${accuracy}%`} />
            <ResultStat
              icon={ListChecks}
              label={t('exam.completion')}
              value={`${answered}/${total}`}
            />
            {unanswered > 0 ? (
              <ResultStat icon={AlertTriangle} label={t('exam.unanswered')} value={String(unanswered)} tone="warning" />
            ) : null}
            <ResultStat icon={Timer} label={t('exam.time')} value={formatDuration(duration)} />
          </dl>

          {percent >= 90 && <CertificateCard name="KeyMaster" percent={percent} />}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setPhase('setup')}>{t('exam.newExam')}</Button>
            <Link to="/path" className="btn-secondary text-button">
              {t('exam.toPath')}
            </Link>
          </div>
        </GlassCard>
      </div>
    )
  }

  const totalSeconds = config.minutes * 60
  const timePct = totalSeconds ? (timeLeft / totalSeconds) * 100 : 0
  const urgent = timeLeft <= 60

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-28 lg:pb-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-muted text-sm font-medium">{t('exam.runningLabel', { n: index + 1, total })}</p>
          <StatusBadge tone="neutral">{courseLabel}</StatusBadge>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-sm font-bold tabular-nums transition-colors',
            urgent ? 'bg-signal/15 text-signal' : 'bg-[var(--bg-muted)] text-[var(--text-primary)]',
          )}
          role="timer"
          aria-live={urgent ? 'assertive' : 'off'}
          aria-label={t('exam.timeLeft')}
        >
          <Timer className="h-3.5 w-3.5" aria-hidden />
          {formatDuration(timeLeft)}
        </div>
      </div>

      <ProgressBar
        value={timePct}
        className="mb-2 h-1"
        barClassName={urgent ? 'bg-signal' : undefined}
      />
      <ProgressBar value={((index + (feedback ? 1 : 0)) / total) * 100} className="mb-4" />

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm font-semibold tabular-nums">
          <span className="flex items-center gap-1.5 text-success-700 dark:text-success-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {right}
          </span>
          <span className="flex items-center gap-1.5 text-signal">
            <XCircle className="h-4 w-4" aria-hidden />
            {wrong}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm(t('exam.exitConfirm'))) finish(false)
          }}
        >
          {t('exam.exit')}
        </Button>
      </div>

      {feedback ? (
        <div
          className={cn(
            'rounded-[var(--radius-card)] border p-8 text-center',
            feedback.ok ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-signal/40 bg-signal/10',
          )}
          role="status"
          aria-live="polite"
        >
          <p
            className={cn(
              'text-2xl font-bold',
              feedback.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-signal',
            )}
          >
            {feedback.ok ? t('exam.ok') : t('exam.bad')}
          </p>
          <p className="text-muted mt-3">{feedback.prompt}</p>
          <p className="text-muted mt-6 text-sm font-medium">{t('exam.correctCombo')}</p>
          <div className="mt-3">
            <KeyCombo keys={feedback.keys} />
          </div>
          <p className="mt-4 font-mono text-lg font-semibold">{formatShortcut(feedback.keys)}</p>
          <p className="text-muted mt-6 text-sm">{t('exam.nextIn', { n: countdown || 1 })}</p>
          <button type="button" onClick={goNext} className="mt-4 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {t('exam.skipWait')}
          </button>
        </div>
      ) : (
        current &&
        currentLoc && (
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

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink dark:text-white">{label}</legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {children}
      </div>
    </fieldset>
  )
}

function OptionChip({
  children,
  selected,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  selected: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        selected
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-brand-500/50',
      )}
    >
      {children}
    </button>
  )
}

function SetupHint({ children, tone }: { children: React.ReactNode; tone: 'warning' | 'info' }) {
  const Icon = tone === 'warning' ? AlertTriangle : Info
  return (
    <p
      className={cn(
        'flex items-start gap-2 text-xs leading-relaxed',
        tone === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-[var(--text-secondary)]',
      )}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  )
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Timer
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-1 truncate text-base font-bold tabular-nums text-ink dark:text-white">{value}</dd>
    </div>
  )
}

function ResultStat({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: typeof Timer
  label: string
  value: string
  tone?: 'neutral' | 'success' | 'danger' | 'warning'
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-soft)] p-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        <Icon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            tone === 'success' && 'text-success-600 dark:text-success-400',
            tone === 'danger' && 'text-signal',
            tone === 'warning' && 'text-amber-600 dark:text-amber-400',
          )}
          aria-hidden
        />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-1 text-xl font-bold tabular-nums text-ink dark:text-white">{value}</dd>
    </div>
  )
}

function CertificateCard({ name, percent }: { name: string; percent: number }) {
  const t = useT()
  return (
    <div className="mt-8 rounded-[var(--radius-lg)] border border-brand-600/30 bg-gradient-to-br from-brand-50 to-white p-6 text-center dark:from-brand-950/50 dark:to-slate-900">
      <Award className="mx-auto h-8 w-8 text-brand-700 dark:text-brand-300" aria-hidden />
      <p className="mt-2 text-sm uppercase tracking-widest text-brand-700 dark:text-brand-300">
        {t('exam.certificate')}
      </p>
      <p className="font-display mt-2 text-lg font-bold">{name}</p>
      <p className="text-muted text-sm">{t('exam.certificateText', { percent })}</p>
    </div>
  )
}

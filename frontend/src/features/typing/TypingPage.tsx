import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { TypingKeyboard } from '@/features/typing/TypingKeyboard'
import { appendMoreWords, generateTarget, syntaxClass } from '@/features/typing/typingData'
import {
  CODE_LANGS,
  PATH_STAGES,
  calcAccuracy,
  calcAccuracyPrecise,
  calcWpm,
  consumeTypingKey,
  countCorrect,
  fingerForChar,
  formatClock,
  improvementTips,
  needsShift,
  pathThreshold,
  recordKeyStroke,
  weakKeysFromStats,
  type CodeLang,
  type FingerId,
  type LayoutId,
  type PathStage,
  type TimeLimit,
  type TrainMode,
} from '@/features/typing/typingEngine'
import {
  bestSession,
  commitTypingSession,
  formatImproveDelta,
  loadTypingSettings,
  loadTypingStore,
  mergeKeyStats,
  pathPercent,
  saveTypingSettings,
  summarizeAccuracy,
  totalPracticeMs,
  unlockedStage,
  weekDailyWpm,
  weekSessions,
  type TypingSettings,
  type TypingStore,
} from '@/features/typing/typingProgress'
import { loadTypingBest } from '@/shared/lib/simulatorProgress'
import { PageHeader, PageShell } from '@/shared/components/PageLayout'
import { GlassCard } from '@/shared/components/ui'
import { useT, type TranslationKey } from '@/shared/i18n'
import { cn, formatDuration } from '@/shared/lib/utils'

type View = 'train' | 'path' | 'progress'

const LESSONS: { id: string; mode: TrainMode; stage?: PathStage; label: TranslationKey }[] = [
  { id: 'home', mode: 'practice', stage: 'home', label: 'typing.homeRow' },
  { id: 'letters', mode: 'practice', stage: 'letters', label: 'typing.fullKeys' },
  { id: 'words', mode: 'words', label: 'typing.words' },
  { id: 'sentences', mode: 'sentences', label: 'typing.sentences' },
  { id: 'code', mode: 'code', label: 'typing.modeCode' },
]

const MODE_KEY: Record<TrainMode, TranslationKey> = {
  practice: 'typing.modePractice',
  time: 'typing.modeTime',
  words: 'typing.modeWords',
  sentences: 'typing.modeSentences',
  numbers: 'typing.modeNumbers',
  symbols: 'typing.modeSymbols',
  code: 'typing.modeCode',
  weak: 'typing.modeWeak',
}

const PATH_TITLE: Record<PathStage, TranslationKey> = {
  home: 'typing.pathHome',
  letters: 'typing.pathLetters',
  words: 'typing.pathWords',
  sentences: 'typing.pathSentences',
  numbers: 'typing.pathNumbers',
  symbols: 'typing.pathSymbols',
  speed: 'typing.pathSpeed',
  code: 'typing.pathCode',
  advanced: 'typing.pathAdvanced',
}

const PATH_DESC: Record<PathStage, TranslationKey> = {
  home: 'typing.pathHomeDesc',
  letters: 'typing.pathLettersDesc',
  words: 'typing.pathWordsDesc',
  sentences: 'typing.pathSentencesDesc',
  numbers: 'typing.pathNumbersDesc',
  symbols: 'typing.pathSymbolsDesc',
  speed: 'typing.pathSpeedDesc',
  code: 'typing.pathCodeDesc',
  advanced: 'typing.pathAdvancedDesc',
}

const FINGER_KEY: Record<FingerId, TranslationKey> = {
  lp: 'typing.fingerLp',
  lr: 'typing.fingerLr',
  lm: 'typing.fingerLm',
  li: 'typing.fingerLi',
  th: 'typing.fingerTh',
  ri: 'typing.fingerRi',
  rm: 'typing.fingerRm',
  rr: 'typing.fingerRr',
  rp: 'typing.fingerRp',
}

const ACH_KEY: Record<string, TranslationKey> = {
  first_practice: 'typing.achFirst',
  wpm_20: 'typing.ach20',
  wpm_40: 'typing.ach40',
  wpm_60: 'typing.ach60',
  wpm_80: 'typing.ach80',
  wpm_100: 'typing.ach100',
  acc_95: 'typing.ach95',
  acc_98: 'typing.ach98',
  personal_best: 'typing.achBest',
  streak_7: 'typing.achStreak7',
  streak_30: 'typing.achStreak30',
  code_typing: 'typing.achCode',
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        active
          ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-ink'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
      )}
    >
      {children}
    </button>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values)
  const pts = values
    .map((v, i) => {
      const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * 100
      const y = 28 - (v / max) * 24
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox="0 0 100 32" className="h-16 w-full" role="img" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} className="text-brand-600 dark:text-brand-400" />
    </svg>
  )
}

export function TypingPage() {
  const t = useT()
  const [view, setView] = useState<View>('train')
  const [settings, setSettings] = useState<TypingSettings>(() => loadTypingSettings())
  const [store, setStore] = useState<TypingStore>(() => loadTypingStore())
  const [mode, setMode] = useState<TrainMode>('practice')
  const [stage, setStage] = useState<PathStage>('home')
  const timeLimit: TimeLimit = 30
  const [codeLang, setCodeLang] = useState<CodeLang>('javascript')
  const [target, setTarget] = useState(() =>
    generateTarget({ mode: 'practice', layout: loadTypingSettings().layout, difficulty: loadTypingStore().difficulty, stage: 'home' }),
  )
  const [typed, setTyped] = useState('')
  const [errors, setErrors] = useState(0)
  const [shiftMisses, setShiftMisses] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [pauseMs, setPauseMs] = useState(0)
  const [paused, setPaused] = useState(false)
  const pauseStartedRef = useRef<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [done, setDone] = useState(false)
  const [focused, setFocused] = useState(false)
  const [last, setLast] = useState<{ key: string; ok: boolean } | null>(null)
  const [sessionStats, setSessionStats] = useState<Record<string, { hits: number; misses: number }>>({})
  const [result, setResult] = useState<{
    previousWpm: number | null
    isPersonalBest: boolean
    newAchievements: string[]
  } | null>(null)
  const [best, setBest] = useState(() => loadTypingBest())
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const committedRef = useRef(false)
  const lastTimerRef = useRef<number>(0)
  const ignoreInputRef = useRef(false)

  const layout = settings.layout
  const difficulty = store.difficulty
  const isCode = mode === 'code' || stage === 'code'

  const rebuild = useCallback(
    (next?: { mode?: TrainMode; stage?: PathStage; layout?: LayoutId; timeLimit?: TimeLimit; codeLang?: CodeLang }) => {
      const nextMode = next?.mode ?? mode
      const nextStage = next?.stage ?? stage
      const nextLayout = next?.layout ?? layout
      const nextLimit = next?.timeLimit ?? timeLimit
      const nextLang = next?.codeLang ?? codeLang
      const weak = weakKeysFromStats(loadTypingStore().keyStats).map((k) => k.key)
      setTarget(
        generateTarget({
          mode: nextMode,
          layout: nextLayout,
          difficulty,
          stage: nextStage,
          timeLimit: nextLimit,
          codeLang: nextLang,
          weakKeys: weak,
        }),
      )
      setTyped('')
      setErrors(0)
      setShiftMisses(0)
      setStartedAt(null)
      setPauseMs(0)
      setPaused(false)
      pauseStartedRef.current = null
      setDone(false)
      setResult(null)
      setSessionStats({})
      committedRef.current = false
      setNow(Date.now())
      inputRef.current?.focus()
    },
    [mode, stage, layout, timeLimit, codeLang, difficulty],
  )

  const persistSettings = (patch: Partial<TypingSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveTypingSettings(next)
  }

  const elapsed = startedAt ? Math.max(0, (paused && pauseStartedRef.current ? pauseStartedRef.current : now) - startedAt - pauseMs) : 0
  const remaining = mode === 'time' ? Math.max(0, timeLimit * 1000 - elapsed) : null
  const correctCount = useMemo(() => countCorrect(typed, target), [typed, target])
  const wpm = calcWpm(correctCount, elapsed)
  const accuracy = calcAccuracy(correctCount, typed.length || 0)
  const accuracyPrecise = calcAccuracyPrecise(correctCount, typed.length || 0)
  const nextChar = target[typed.length] ?? ''
  const progress = target.length ? Math.min(100, (typed.length / target.length) * 100) : 0
  const timeLabel = remaining != null ? formatClock(remaining) : formatClock(elapsed)
  const busy = Boolean(startedAt) && !done && !paused
  const weak = useMemo(() => weakKeysFromStats(mergeKeyStats(store.keyStats, sessionStats)), [store.keyStats, sessionStats])

  const finish = useCallback(() => {
    setDone(true)
    setNow(Date.now())
    setPaused(false)
    pauseStartedRef.current = null
  }, [])

  useEffect(() => {
    if (view === 'train') inputRef.current?.focus()
  }, [view, mode])

  useEffect(() => {
    if (!startedAt || done || paused) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [startedAt, done, paused])

  useEffect(() => {
    if (mode !== 'time' || !startedAt || done || paused) return
    if (remaining === 0) finish()
  }, [mode, startedAt, done, paused, remaining, finish])

  useEffect(() => {
    if (mode !== 'time' || done || paused) return
    if (typed.length > target.length - 24) {
      setTarget((prev) => prev + appendMoreWords(layout, difficulty))
    }
  }, [typed.length, target.length, mode, done, paused, layout, difficulty])

  useEffect(() => {
    if (!done || committedRef.current) return
    committedRef.current = true
    const durationMs = Math.max(elapsed, 400)
    const incorrect = Math.max(errors, typed.length - correctCount)
    const payload = commitTypingSession(
      {
        at: Date.now(),
        mode,
        wpm,
        accuracy: accuracyPrecise,
        errors,
        durationMs,
        correct: correctCount,
        incorrect,
        stage: mode === 'practice' ? stage : mode === 'code' ? 'code' : undefined,
      },
      { ...mergeKeyStats(store.keyStats, sessionStats) },
    )
    setStore(payload.store)
    setBest(loadTypingBest())
    setResult({
      previousWpm: payload.previousWpm,
      isPersonalBest: payload.isPersonalBest,
      newAchievements: payload.newAchievements,
    })
  }, [done, elapsed, errors, typed.length, correctCount, mode, wpm, accuracyPrecise, stage, store.keyStats, sessionStats])

  const flashLast = (key: string, ok: boolean) => {
    setLast({ key, ok })
    window.clearTimeout(lastTimerRef.current)
    lastTimerRef.current = window.setTimeout(() => setLast(null), 140)
  }

  const insertChar = useCallback(
    (ch: string) => {
      if (done || paused) return
      setStartedAt((s) => s ?? Date.now())
      setTyped((prev) => {
        const expected = target[prev.length]
        if (expected === undefined) {
          if (mode !== 'time') {
            queueMicrotask(() => finish())
          }
          return prev
        }
        const ok = ch === expected
        if (!ok) {
          setErrors((n) => n + 1)
          if (needsShift(expected, layout) || needsShift(ch, layout)) setShiftMisses((n) => n + 1)
        }
        setSessionStats((s) => recordKeyStroke(s, expected, ch))
        flashLast(ch, ok)
        const next = prev + ch
        if (mode !== 'time' && next.length >= target.length) {
          queueMicrotask(() => finish())
          return next.slice(0, target.length)
        }
        return next
      })
    },
    [done, paused, target, mode, layout, finish],
  )

  const backspace = useCallback(() => {
    if (done || paused) return
    setTyped((s) => s.slice(0, -1))
  }, [done, paused])

  const togglePause = useCallback(() => {
    if (!startedAt || done) return
    setPaused((p) => {
      if (!p) {
        pauseStartedRef.current = Date.now()
        return true
      }
      const started = pauseStartedRef.current
      if (started) setPauseMs((ms) => ms + (Date.now() - started))
      pauseStartedRef.current = null
      setNow(Date.now())
      inputRef.current?.focus()
      return false
    })
  }, [startedAt, done])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const action = consumeTypingKey(e.nativeEvent)
    if (action.kind === 'ignore' && e.key === 'Unidentified') return
    if (action.kind === 'ignore') return
    e.preventDefault()
    if (action.kind === 'restart') {
      rebuild()
      return
    }
    if (action.kind === 'pause') {
      togglePause()
      return
    }
    if (paused || done) return
    if (action.kind === 'backspace') {
      backspace()
      return
    }
    if (action.kind === 'char') {
      const expected = target[typed.length]
      if ((action.char === '\n' || action.char === '\t') && action.char !== expected) return
      ignoreInputRef.current = true
      insertChar(action.char)
    }
  }

  const finger = nextChar ? fingerForChar(nextChar, layout) : null
  const delta = result ? formatImproveDelta(wpm, result.previousWpm) : null
  const tips = improvementTips({ accuracy: accuracyPrecise, wpm, weak, errors, shiftMisses })

  const liveStats = [
    { label: t('typing.wpm'), value: wpm },
    { label: t('typing.accuracy'), value: `${accuracy}%` },
    { label: t('typing.errors'), value: errors },
    { label: t('typing.bestWpm'), value: best?.wpm ?? '—' },
  ]

  return (
    <PageShell width="5xl" className="max-w-4xl">
      <PageHeader
        className={cn(busy && 'mb-4')}
        eyebrow={busy ? undefined : t('typing.eyebrow')}
        title={busy ? t(MODE_KEY[mode]) : t('typing.title')}
        subtitle={busy ? undefined : t('typing.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1" role="group" aria-label={t('typing.title')}>
              <SegBtn active={view === 'train'} onClick={() => setView('train')}>
                {t('typing.viewTrain')}
              </SegBtn>
              <SegBtn active={view === 'path'} onClick={() => setView('path')}>
                {t('typing.path')}
              </SegBtn>
              <SegBtn active={view === 'progress'} onClick={() => setView('progress')}>
                {t('typing.progress')}
              </SegBtn>
            </div>
            <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1" role="group" aria-label={t('typing.layoutRu')}>
              <SegBtn active={layout === 'ru'} onClick={() => { persistSettings({ layout: 'ru' }); rebuild({ layout: 'ru' }) }}>
                {t('typing.layoutRu')}
              </SegBtn>
              <SegBtn active={layout === 'en'} onClick={() => { persistSettings({ layout: 'en' }); rebuild({ layout: 'en' }) }}>
                {t('typing.layoutEn')}
              </SegBtn>
            </div>
          </div>
        }
      />

      {view === 'path' ? (
        <PathPanel
          store={store}
          onStart={(nextStage) => {
            setMode('practice')
            setStage(nextStage)
            setView('train')
            rebuild({ mode: 'practice', stage: nextStage })
          }}
        />
      ) : null}

      {view === 'progress' ? <ProgressPanel store={store} best={best} /> : null}

      {view === 'train' ? (
        <>
          {!busy ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {LESSONS.map((item) => {
                const on = item.mode === 'practice' ? mode === 'practice' && stage === item.stage : mode === item.mode
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMode(item.mode)
                      if (item.stage) setStage(item.stage)
                      rebuild({ mode: item.mode, stage: item.stage })
                    }}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                      on
                        ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-ink'
                        : 'border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    {t(item.label)}
                  </button>
                )
              })}
            </div>
          ) : null}

          {!busy && mode === 'code' ? (
            <div className="mb-4 flex flex-wrap gap-1">
              {CODE_LANGS.map((lang) => (
                <SegBtn key={lang} active={codeLang === lang} onClick={() => { setCodeLang(lang); rebuild({ codeLang: lang }) }}>
                  {lang}
                </SegBtn>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {liveStats.map((item) => (
              <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-3 text-center sm:px-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{item.label}</p>
                <p className="font-display mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)] sm:text-2xl">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]">
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-150 dark:bg-brand-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-center text-xs text-[var(--text-muted)]">{timeLabel}</p>

          {done && result ? (
            <ResultCard
              wpm={wpm}
              accuracy={accuracyPrecise}
              errors={errors}
              timeLabel={formatClock(elapsed)}
              correct={correctCount}
              incorrect={Math.max(errors, typed.length - correctCount)}
              delta={delta}
              isPersonalBest={result.isPersonalBest}
              best={best?.wpm ?? wpm}
              weak={weak}
              tips={tips}
              achievements={result.newAchievements}
              onAgain={() => rebuild()}
              onWeak={() => {
                setMode('weak')
                setView('train')
                rebuild({ mode: 'weak' })
              }}
            />
          ) : (
            <GlassCard className="relative mt-5 !p-4 sm:!p-7">
              {paused ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[var(--radius-card)] bg-[var(--bg-elevated)]/85 backdrop-blur-sm">
                  <p className="text-lg font-semibold">{t('typing.pausedTitle')}</p>
                  <p className="text-muted mt-1 text-sm">{t('typing.pausedHint')}</p>
                  <button type="button" className="btn-primary mt-4" onClick={togglePause}>
                    {t('typing.resume')}
                  </button>
                </div>
              ) : null}

              <div
                className={cn(
                  'relative min-h-[168px] w-full overflow-x-hidden font-mono text-[17px] leading-8 tracking-[0.01em] sm:min-h-[200px] sm:text-[22px] sm:leading-10',
                  isCode && 'whitespace-pre-wrap',
                )}
              >
                <textarea
                  ref={inputRef}
                  aria-label={t('typing.focusHint')}
                  className="absolute inset-0 z-[1] resize-none bg-transparent text-transparent caret-transparent outline-none"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={onKeyDown}
                  onInput={(e) => {
                    if (ignoreInputRef.current) {
                      ignoreInputRef.current = false
                      e.currentTarget.value = ''
                      return
                    }
                    const value = e.currentTarget.value
                    if (!value) return
                    e.currentTarget.value = ''
                    for (const ch of value) insertChar(ch)
                  }}
                />
                <div aria-hidden className="relative z-0">
                  {target.split('').map((ch, i) => {
                    const typedCh = typed[i]
                    const current = i === typed.length
                    let cls = cn('text-[var(--text-muted)]', syntaxClass(ch, isCode))
                    if (typedCh !== undefined) {
                      cls = typedCh === ch ? 'text-[var(--text-primary)]' : 'bg-rose-500/10 text-rose-600 dark:text-rose-300'
                    } else if (current) {
                      cls =
                        'relative text-[var(--text-primary)] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:animate-pulse after:bg-brand-600 dark:after:bg-brand-400'
                    }
                    const shown = ch === '\n' ? '↵' : ch === '\t' ? '⇥' : ch === ' ' ? '\u00A0' : ch
                    return (
                      <span key={i} className={cls}>
                        {shown}
                        {ch === '\n' ? <br /> : null}
                      </span>
                    )
                  })}
                </div>
              </div>
              {!focused && !paused ? (
                <p className="text-muted mt-4 text-center text-xs">{t('typing.focusHint')}</p>
              ) : null}
            </GlassCard>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <button type="button" className="btn-secondary !px-3 !py-2 text-sm" onClick={() => rebuild()} aria-label={t('typing.again')}>
              <RotateCcw className="h-4 w-4" />
              {t('typing.again')}
            </button>
            <button
              type="button"
              className="btn-ghost !px-3 !py-2 text-xs"
              onClick={() => persistSettings({ showKeyboard: !settings.showKeyboard })}
            >
              {settings.showKeyboard ? t('typing.hideKeyboard') : t('typing.showKeyboard')}
            </button>
          </div>

          {settings.showKeyboard && !done ? (
            <GlassCard className="mt-4 !p-3 sm:!p-4">
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t('typing.keyboardGuide')}
              </p>
              <TypingKeyboard layout={layout} nextChar={paused ? '' : nextChar} last={last} compact />
              {settings.fingerHints && nextChar && !paused ? (
                <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
                  {t('typing.nextFinger', { finger: t(FINGER_KEY[finger ?? 'th']) })}
                  {needsShift(nextChar, layout) ? ` · ${t('typing.shiftHint')}` : ''}
                </p>
              ) : null}
            </GlassCard>
          ) : null}
        </>
      ) : null}
    </PageShell>
  )
}

function ResultCard({
  wpm,
  accuracy,
  errors,
  timeLabel,
  correct,
  incorrect,
  delta,
  isPersonalBest,
  best,
  weak,
  tips,
  achievements,
  onAgain,
  onWeak,
}: {
  wpm: number
  accuracy: number
  errors: number
  timeLabel: string
  correct: number
  incorrect: number
  delta: number | null
  isPersonalBest: boolean
  best: number
  weak: { key: string; accuracy: number }[]
  tips: string[]
  achievements: string[]
  onAgain: () => void
  onWeak: () => void
}) {
  const t = useT()
  const deltaLabel =
    delta == null ? null : `${delta > 0 ? '+' : ''}${delta}`

  return (
    <GlassCard className="mt-5 !p-6">
      <p className="text-center text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('typing.doneTitle')}</p>
      <p className="font-display mt-3 text-center text-5xl font-bold tabular-nums tracking-tight">{wpm} <span className="text-2xl text-[var(--text-muted)]">WPM</span></p>
      <p className="mt-2 text-center text-lg tabular-nums text-[var(--text-primary)]">{accuracy}% {t('typing.accuracy')}</p>
      {deltaLabel ? (
        <p className={cn('mt-1 text-center text-sm', delta != null && delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
          {t('typing.resultDelta', { delta: deltaLabel })}
        </p>
      ) : null}
      {isPersonalBest ? <p className="mt-1 text-center text-xs font-semibold text-brand-700 dark:text-brand-300">{t('typing.resultBest')}</p> : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label={t('typing.errors')} value={errors} />
        <MiniStat label={t('typing.time')} value={timeLabel} />
        <MiniStat label={t('typing.resultCorrect')} value={correct} />
        <MiniStat label={t('typing.resultIncorrect')} value={incorrect} />
      </div>
      <p className="mt-3 text-center text-xs text-[var(--text-muted)]">{t('typing.bestWpm')}: {best}</p>

      <div className="mt-6">
        <h3 className="text-sm font-semibold">{t('typing.whatToImprove')}</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-muted)]">
          {tips.map((tip, i) => {
            if (tip === 'accuracy') return <li key={tip}>{t('typing.tipAccuracy')}</li>
            if (tip === 'speed') return <li key={tip}>{t('typing.tipSpeed')}</li>
            if (tip === 'shift') return <li key={tip}>{t('typing.tipShift')}</li>
            if (tip === 'consistency') return <li key={tip}>{t('typing.tipConsistency')}</li>
            const item = weak[tip === 'weakKey' ? 0 : 1]
            if (!item) return null
            return <li key={`${tip}-${i}`}>{t('typing.tipWeakKey', { key: item.key, accuracy: item.accuracy })}</li>
          })}
        </ul>
      </div>

      {weak.length ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">{t('typing.weakKeysTitle')}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {weak.map((item) => (
              <span key={item.key} className="rounded-md border border-[var(--border-default)] px-2 py-1 font-mono text-xs">
                {item.key} — {item.accuracy}%
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-[var(--text-muted)]">{t('typing.noWeakKeys')}</p>
      )}

      {achievements.length ? (
        <ul className="mt-4 space-y-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
          {achievements.map((id) => (
            <li key={id}>{t('typing.newAchievement', { name: t(ACH_KEY[id] ?? 'typing.achFirst') })}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button type="button" className="btn-primary" onClick={onAgain}>
          {t('typing.again')}
        </button>
        <button type="button" className="btn-secondary" onClick={onWeak}>
          {t('typing.practiceWeak')}
        </button>
        <Link to="/simulator?mode=desktop" className="btn-secondary">
          {t('typing.toSimulator')}
        </Link>
      </div>
    </GlassCard>
  )
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--bg-muted)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function PathPanel({ store, onStart }: { store: TypingStore; onStart: (stage: PathStage) => void }) {
  const t = useT()
  return (
    <GlassCard className="mb-6">
      <h2 className="text-lg font-semibold">{t('typing.pathTitle')}</h2>
      <p className="text-muted mt-1 text-sm">{t('typing.pathSubtitle')}</p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{t('typing.lessonsProgress')}: {pathPercent(store.path)}%</p>
      <ol className="mt-5 space-y-2">
        {PATH_STAGES.map((item) => {
          const open = unlockedStage(store.path, item)
          const done = store.path[item].completed >= 1
          const need = pathThreshold(item)
          return (
            <li key={item} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{t(PATH_TITLE[item])}</p>
                <p className="text-muted truncate text-xs">{t(PATH_DESC[item])}</p>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {done ? t('typing.pathDone') : open ? `${need.wpm}+ WPM · ${need.accuracy}%` : t('typing.pathLocked')}
                </p>
              </div>
              <button type="button" className="btn-primary !px-3 !py-1.5 text-xs" disabled={!open} onClick={() => onStart(item)}>
                {done ? t('typing.pathContinue') : t('typing.pathStart')}
              </button>
            </li>
          )
        })}
      </ol>
    </GlassCard>
  )
}

function ProgressPanel({ store, best }: { store: TypingStore; best: { wpm: number; accuracy: number } | null }) {
  const t = useT()
  const week = weekSessions(store.sessions)
  const series = weekDailyWpm(store.sessions)
  const top = bestSession(store.sessions)
  const avgAcc = summarizeAccuracy(week)
  return (
    <GlassCard className="mb-6">
      <h2 className="text-lg font-semibold">{t('typing.progressTitle')}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label={t('typing.bestWpm')} value={best?.wpm ?? top?.wpm ?? '—'} />
        <MiniStat label={t('typing.accuracy')} value={avgAcc ? `${avgAcc}%` : '—'} />
        <MiniStat label={t('typing.sessions')} value={store.sessions.length} />
        <MiniStat label={t('typing.streak')} value={store.streak} />
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {t('typing.practiceTime')}: {formatDuration(Math.round(totalPracticeMs(store.sessions) / 1000))}
      </p>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('typing.weekWpm')}</p>
        <Sparkline values={series.map((d) => d.wpm)} />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
          {series.map((d) => (
            <span key={d.day}>{d.day.slice(3)}</span>
          ))}
        </div>
      </div>
      {store.unlocked.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {store.unlocked.map((id) => (
            <span key={id} className="rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[11px] font-semibold">
              {t(ACH_KEY[id] ?? 'typing.achFirst')}
            </span>
          ))}
        </div>
      ) : null}
    </GlassCard>
  )
}

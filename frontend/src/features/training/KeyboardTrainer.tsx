import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

import {
  chordDisplay,
  chordFromEvent,
  displayKey,
  explainMismatch,
  formatShortcut,
  matchesShortcut,
  needsDemoEditor,
  splitShortcut,
  webPracticeKeys,
  isOsCapturedShortcut,
  type TrainerMode,
} from '@/shared/lib/hotkeys'
import { useT, type TranslateFn } from '@/shared/i18n'
import { KeyCombo } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

interface Props {
  actionPrompt: string
  keys: string[]
  onResult: (correct: boolean, responseMs: number) => void
  disabled?: boolean
  /** learn = show answer + steps; practice = hide until hints; exam = never show */
  mode?: TrainerMode
  title?: string
}

function demoEffectMessage(keys: string[], t: TranslateFn): string | null {
  const sorted = [...keys].sort().join('|')
  if (sorted === 'Control|X') return t('trainer.cut')
  if (sorted === 'Control|C') return t('trainer.copy')
  if (sorted === 'Control|V') return t('trainer.paste')
  if (sorted === 'Control|Z') return t('trainer.undo')
  return null
}

function applyDemoEffect(
  keys: string[],
  text: string,
  pastedFragment: string,
): string {
  const sorted = [...keys].sort().join('|')
  if (sorted === 'Control|X') return ''
  if (sorted === 'Control|C') return text
  if (sorted === 'Control|V') return text ? `${text}\n${pastedFragment}` : pastedFragment
  return text
}

export function KeyboardTrainer({
  actionPrompt,
  keys,
  onResult,
  disabled,
  mode = 'learn',
  title,
}: Props) {
  const t = useT()
  const demoDefault = t('trainer.demoDefault')
  const [flash, setFlash] = useState<'ok' | 'err' | null>(null)
  const [liveChord, setLiveChord] = useState<string[]>([])
  const [focused, setFocused] = useState(false)
  const [demoText, setDemoText] = useState(demoDefault)
  const [resultHint, setResultHint] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [coachTip, setCoachTip] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [revealKeys, setRevealKeys] = useState(mode === 'learn')

  const started = useRef(Date.now())
  const boxRef = useRef<HTMLDivElement>(null)
  const submitted = useRef(false)
  const lastWrongAt = useRef(0)

  const practiceKeys = useMemo(() => webPracticeKeys(keys), [keys])
  const metaBlocked = isOsCapturedShortcut(keys)
  const { modifiers, main } = useMemo(() => splitShortcut(practiceKeys), [practiceKeys])
  const showDemo = needsDemoEditor(keys)
  const showAnswerKeys = mode === 'learn' || (mode === 'practice' && revealKeys)

  const reset = useCallback(() => {
    setDone(false)
    setFlash(null)
    setLiveChord([])
    setDemoText(demoDefault)
    setResultHint(null)
    setMistakes(0)
    setCoachTip(null)
    setRevealKeys(mode === 'learn')
    submitted.current = false
    started.current = Date.now()
    setTimeout(() => boxRef.current?.focus(), 50)
  }, [mode, demoDefault])

  useEffect(() => {
    reset()
  }, [actionPrompt, keys, reset])

  const evaluate = useCallback(
    (e: KeyboardEvent) => {
      if (disabled || done) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (!boxRef.current?.contains(e.target)) return
      }

      e.preventDefault()
      e.stopPropagation()

      const chord = chordFromEvent(e)
      setLiveChord(chord)
      if (chord.length === 0) return

      // Only modifier held — coach, don't count as error
      const onlyMods = chord.every((k) => ['Control', 'Shift', 'Alt', 'Meta'].includes(k))
      if (onlyMods) {
        setCoachTip(
          t('trainer.holdMods', {
            mods: chord.map(displayKey).join('+'),
            main: displayKey(main ?? ''),
          }),
        )
        return
      }

      if (matchesShortcut(keys, e)) {
        setDone(true)
        setFlash('ok')
        setCoachTip(null)
        setDemoText((prev) => applyDemoEffect(practiceKeys, prev, t('trainer.pastedFragment')))
        setResultHint(
          demoEffectMessage(practiceKeys, t) ??
            t('trainer.remember', { shortcut: formatShortcut(keys), prompt: actionPrompt }),
        )
        if (!submitted.current) {
          submitted.current = true
          onResult(true, Date.now() - started.current)
        }
        if (mode !== 'exam') toast.success(t('trainer.okToast'))
        return
      }

      // Wrong full attempt — throttle spam
      const now = Date.now()
      if (now - lastWrongAt.current < 450) return
      lastWrongAt.current = now

      const tip = mode === 'exam' ? t('trainer.badExam') : explainMismatch(keys, chord, t)

      setFlash('err')
      setCoachTip(tip)
      setMistakes((m) => {
        const next = m + 1
        if (mode === 'practice' && next >= 2) setRevealKeys(true)
        return next
      })

      if (mode === 'exam') {
        setDone(true)
        if (!submitted.current) {
          submitted.current = true
          onResult(false, Date.now() - started.current)
        }
        return
      }

      onResult(false, Date.now() - started.current)
      toast.error(mode === 'learn' ? t('trainer.almost') : t('trainer.wrong'))
      setTimeout(() => setFlash(null), 700)
    },
    [actionPrompt, disabled, done, keys, main, mode, onResult, practiceKeys, t],
  )

  useEffect(() => {
    if (disabled || done) return
    const onKeyDown = (e: KeyboardEvent) => evaluate(e)
    const onKeyUp = (e: KeyboardEvent) => {
      const chord = chordFromEvent(e)
      // Keep showing held modifiers after partial release
      setLiveChord(chord.filter((k) => ['Control', 'Shift', 'Alt', 'Meta'].includes(k) && (
        (k === 'Control' && e.ctrlKey) ||
        (k === 'Shift' && e.shiftKey) ||
        (k === 'Alt' && e.altKey) ||
        (k === 'Meta' && e.metaKey)
      )))
      if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) setLiveChord([])
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [disabled, done, evaluate])

  const step = !done
    ? liveChord.some((k) => ['Control', 'Shift', 'Alt', 'Meta'].includes(k))
      ? 2
      : 1
    : 3

  const stepLabels = [
    {
      n: 1,
      label: modifiers.length
        ? t('trainer.stepHold', { mods: modifiers.map(displayKey).join('+') })
        : t('trainer.stepReady'),
    },
    {
      n: 2,
      label: main ? t('trainer.stepPress', { key: displayKey(main) }) : t('trainer.stepPressKey'),
    },
    { n: 3, label: t('trainer.stepDone') },
  ]

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      role="application"
      aria-label={t('trainer.aria')}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        'relative overflow-hidden rounded-3xl border p-6 outline-none transition-colors duration-300 md:p-8',
        focused && !done && 'ring-2 ring-brand-500/40',
        flash === 'ok' && 'border-emerald-500/50 bg-emerald-500/10',
        flash === 'err' && 'border-rose-500/50 bg-rose-500/10',
        !flash && 'border-slate-200 dark:border-slate-700',
      )}
    >
      {title && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-600">{title}</p>}

      {metaBlocked && !done && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-amber-900 dark:text-amber-100">
          <p className="font-semibold">{t('trainer.osCapture', { shortcut: formatShortcut(keys) })}</p>
          <p className="mt-1 text-xs opacity-90">
            {t('trainer.osCaptureHint', {
              practice: formatShortcut(practiceKeys),
              real: formatShortcut(keys),
            })}
          </p>
        </div>
      )}

      {!focused && !done && (
        <p className="mb-4 rounded-xl bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
          {t('trainer.clickHint', {
            combo: metaBlocked ? formatShortcut(practiceKeys) : t('trainer.pressCombo'),
          })}
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.p
          key={actionPrompt}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 text-center text-xl font-semibold md:text-2xl"
        >
          {actionPrompt}
        </motion.p>
      </AnimatePresence>
      {metaBlocked && (
        <p className="mb-4 text-center text-sm font-medium text-brand-600">
          {t('trainer.inTrainer', { shortcut: formatShortcut(practiceKeys) })}
        </p>
      )}
      <p className="mb-6 text-center text-sm text-slate-500">
        {mode === 'exam'
          ? t('trainer.examHint')
          : mode === 'practice'
            ? t('trainer.practiceHint')
            : t('trainer.learnHint')}
      </p>

      {/* Progressive steps */}
      {mode !== 'exam' && !done && (
        <ol className="mb-6 grid gap-2 sm:grid-cols-3">
          {stepLabels.map((s) => (
            <li
              key={s.n}
              className={cn(
                'rounded-xl border px-3 py-2 text-center text-xs font-medium',
                step === s.n && 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-200',
                step > s.n && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                step < s.n && 'border-slate-200 text-slate-400 dark:border-slate-700',
              )}
            >
              {t('trainer.step', { n: s.n, label: s.label })}
            </li>
          ))}
        </ol>
      )}

      {showDemo && (
        <div className="mb-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900/50">
          <p className="mb-2 text-xs text-slate-500">{t('trainer.demoField')}</p>
          <div
            className={cn(
              'min-h-[3.25rem] rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950',
              !done && demoText && 'selection:bg-sky-300/80',
            )}
          >
            {!done && demoText ? (
              <mark className="rounded bg-sky-300/70 px-0.5 text-slate-900 dark:bg-sky-500/40 dark:text-slate-100">
                {demoText}
              </mark>
            ) : demoText ? (
              <span>{demoText}</span>
            ) : (
              <span className="italic text-slate-400">{t('trainer.textCut')}</span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {done ? resultHint ?? t('trainer.done') : t('trainer.selectedHelp')}
          </p>
        </div>
      )}

      {showAnswerKeys ? (
        <div className="mb-2">
          <p className="mb-3 text-center text-xs font-medium text-slate-500">
            {t('trainer.needPress', { hint: metaBlocked ? t('trainer.inBrowser') : '' })}
          </p>
          <KeyCombo keys={practiceKeys} activeKeys={!done && liveChord.length ? liveChord : undefined} />
          {metaBlocked && (
            <p className="mt-2 text-center text-xs text-slate-500">
              {t('trainer.inSystem', { shortcut: formatShortcut(keys) })}
            </p>
          )}
        </div>
      ) : (
        <p className="mb-4 text-center text-sm text-slate-500">
          {t('trainer.hintHidden')}
          {mode === 'practice' && mistakes > 0 ? t('trainer.mistakes', { n: mistakes }) : ''}
        </p>
      )}

      <p className="mt-4 text-center font-mono text-sm text-slate-600 dark:text-slate-300">
        {t('trainer.currentlyPressed')}{' '}
        <span className="font-semibold text-brand-600 dark:text-brand-400">
          {done ? formatShortcut(practiceKeys) : chordDisplay(liveChord)}
        </span>
      </p>

      {coachTip && !done && (
        <p className="mt-4 rounded-xl bg-slate-100 px-3 py-2 text-center text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {coachTip}
        </p>
      )}

      {done && (
        <div className="mt-6 space-y-3 text-center">
          <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">{t('trainer.accepted')}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('trainer.rememberDone', {
              shortcut: formatShortcut(keys),
              trainerNote: metaBlocked
                ? t('trainer.inTrainerWas', { shortcut: formatShortcut(practiceKeys) })
                : '',
              prompt: actionPrompt,
            })}
          </p>
          {resultHint && <p className="text-xs text-slate-500">{resultHint}</p>}
          {mode !== 'exam' && (
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              {t('trainer.tryAgain')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

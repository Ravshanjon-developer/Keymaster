import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HelpCircle, RotateCcw, SkipForward } from 'lucide-react'
import toast from 'react-hot-toast'

import {
  allExpectedModifiersHeld,
  chordFromEvent,
  displayKey,
  explainMismatch,
  formatShortcut,
  heldModifiersAreExpected,
  heldModifiersFromEvent,
  isDestructiveBrowserEvent,
  isModifierKey,
  isOsCapturedShortcut,
  isStandaloneFunctionKey,
  keysForActiveHighlight,
  mainKeyFromEvent,
  matchesShortcutKeys,
  modifiersFromEvent,
  demoEditorKind,
  demoExtraState,
  demoSelectionVisible,
  normalizeShortcutKeys,
  sanitizeChordForMatch,
  splitShortcut,
  webPracticeKeys,
  type HeldModifiers,
  type TrainerMode,
} from '@/shared/lib/hotkeys'
import { useT, type TranslateFn } from '@/shared/i18n'
import { KeyCombo } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

/** 0 = nothing shown, 1 = first key, 2 = all keys + steps, 3 = full answer. */
type HintLevel = 0 | 1 | 2 | 3

export interface KeyboardTrainerProps {
  actionPrompt: string
  keys: string[]
  onResult: (correct: boolean, responseMs: number, meta?: { mistakes: number; usedHint: boolean }) => void
  disabled?: boolean
  mode?: TrainerMode
  /** Short action name, e.g. «Откройте поиск» */
  headline?: string
  /** @deprecated use taskLabel / headline */
  title?: string
  /** One-line why, e.g. «Найдите текст без мыши» */
  why?: string
  /** Plain detailed explanation shown on the card back. */
  detail?: string
  taskLabel?: string
  /** Start with more support for a chord the learner already struggled with. */
  initialHintLevel?: HintLevel
  /** Shows a «пропустить» action when the learner is stuck. */
  onSkip?: () => void
  /** Hide the big headline — used inside the course lesson workspace. */
  compact?: boolean
  /** Stretch demo + keys to fill the lesson practice card. */
  fill?: boolean
}

function demoEffectMessage(keys: string[], t: TranslateFn): string | null {
  const sorted = [...keys].sort().join('|')
  if (sorted === 'Control|A') return t('trainer.selectAll')
  if (sorted === 'Control|X') return t('trainer.cut')
  if (sorted === 'Control|C') return t('trainer.copy')
  if (sorted === 'Control|V') return t('trainer.paste')
  if (sorted === 'Control|Z') return t('trainer.undo')
  if (sorted === 'Control|Y') return t('trainer.redo')
  return null
}

function applyDemoEffect(keys: string[], text: string, pastedFragment: string): string {
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
  headline,
  title,
  why,
  detail,
  taskLabel,
  initialHintLevel = 0,
  onSkip,
  compact = false,
  fill = false,
}: KeyboardTrainerProps) {
  const t = useT()
  const demoDefault = t('trainer.demoDefault')
  const demoSample = t('trainer.demoSample')
  const baseHint: HintLevel = mode === 'learn' ? 2 : mode === 'exam' ? 0 : initialHintLevel

  const [flash, setFlash] = useState<'ok' | 'err' | null>(null)
  const [liveChord, setLiveChord] = useState<string[]>([])
  const [focused, setFocused] = useState(false)
  const [demoText, setDemoText] = useState(() => {
    const kind = demoEditorKind(normalizeShortcutKeys(keys))
    return kind === 'copy' || kind === 'cut' ? demoDefault : demoSample
  })
  const [mistakes, setMistakes] = useState(0)
  const [coachTip, setCoachTip] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [hintLevel, setHintLevel] = useState<HintLevel>(baseHint)
  const [flipped, setFlipped] = useState(false)
  const [shake, setShake] = useState(false)

  const started = useRef(Date.now())
  const boxRef = useRef<HTMLDivElement>(null)
  const submitted = useRef(false)
  const lastWrongAt = useRef(0)
  const heldMods = useRef<HeldModifiers>({})
  const mistakesRef = useRef(0)
  const hintRef = useRef<HintLevel>(baseHint)
  const askedRef = useRef(false)

  const normalizedKeys = useMemo(() => normalizeShortcutKeys(keys), [keys])
  const practiceKeys = useMemo(() => webPracticeKeys(normalizedKeys), [normalizedKeys])
  const metaBlocked = isOsCapturedShortcut(normalizedKeys)
  const fnKeyLesson = isStandaloneFunctionKey(normalizedKeys)
  const { modifiers, main } = useMemo(() => splitShortcut(practiceKeys), [practiceKeys])
  const demoKind = useMemo(() => demoEditorKind(normalizedKeys), [normalizedKeys])
  const initialDemoText = demoKind === 'copy' || demoKind === 'cut' ? demoDefault : demoSample
  const showDemo = Boolean(demoKind)
  const titleText = (headline ?? actionPrompt).trim()
  const labelText = (taskLabel ?? title ?? '').trim()
  const whyText = (why ?? '').trim()
  const coached = mode !== 'exam'

  const focusBox = useCallback(() => {
    window.setTimeout(() => boxRef.current?.focus(), 0)
  }, [])

  const raiseHint = useCallback((level: HintLevel) => {
    setHintLevel((prev) => {
      const next = (Math.max(prev, level) as HintLevel)
      hintRef.current = next
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setDone(false)
    setFlash(null)
    setLiveChord([])
    setDemoText(initialDemoText)
    setMistakes(0)
    mistakesRef.current = 0
    setCoachTip(null)
    setHintLevel(baseHint)
    hintRef.current = baseHint
    askedRef.current = false
    setFlipped(false)
    setShake(false)
    submitted.current = false
    started.current = Date.now()
    heldMods.current = {}
    focusBox()
  }, [baseHint, focusBox, initialDemoText])

  useEffect(() => {
    reset()
  }, [actionPrompt, keys, headline, reset])

  const bumpMistake = useCallback(
    (tip: string) => {
      const now = Date.now()
      if (now - lastWrongAt.current < 450) return
      lastWrongAt.current = now
      setFlash('err')
      setShake(true)
      window.setTimeout(() => setShake(false), 420)
      setCoachTip(tip)
      setMistakes((m) => {
        const next = m + 1
        mistakesRef.current = next
        if (coached) raiseHint(Math.min(next, 2) as HintLevel)
        return next
      })
      window.setTimeout(() => setFlash(null), 700)
    },
    [coached, raiseHint],
  )

  const succeed = useCallback(() => {
    setDone(true)
    setFlash('ok')
    setCoachTip(null)
    raiseHint(3)
    setDemoText((prev) => applyDemoEffect(practiceKeys, prev, t('trainer.pastedFragment')))
    if (!submitted.current) {
      submitted.current = true
      onResult(true, Date.now() - started.current, {
        mistakes: mistakesRef.current,
        usedHint: askedRef.current,
      })
    }
    if (mode !== 'exam') toast.success(t('trainer.okToast'))
  }, [mode, onResult, practiceKeys, raiseHint, t])

  const evaluateChord = useCallback(
    (chord: string[]) => {
      if (disabled || done) return
      if (chord.length === 0) return
      setLiveChord(chord)

      const onlyMods = chord.every((k) => isModifierKey(k))
      if (onlyMods) {
        if (heldModifiersAreExpected(chord, modifiers)) {
          setFlash(null)
          setCoachTip(t('trainer.holdMods', { main: displayKey(main ?? '') }))
        } else if (coached) {
          bumpMistake(
            mistakesRef.current === 0
              ? t('trainer.softFirst')
              : t('hotkeys.wrongMods', {
                  got: chord.map(displayKey).join('+'),
                  need: modifiers.map(displayKey).join('+') || formatShortcut(practiceKeys),
                  target: formatShortcut(practiceKeys),
                }),
          )
        }
        return
      }

      if (matchesShortcutKeys(normalizedKeys, chord)) {
        succeed()
        return
      }

      if (mode === 'exam') {
        setFlash('err')
        setCoachTip(t('trainer.badExam'))
        setDone(true)
        raiseHint(3)
        if (!submitted.current) {
          submitted.current = true
          onResult(false, Date.now() - started.current, { mistakes: 1, usedHint: false })
        }
        return
      }

      const got = splitShortcut(chord)
      const mainOk = Boolean(main && got.main && got.main === main)
      const missingMods = modifiers.filter((m) => !chord.includes(m))

      // Right letter, no modifier held — teach the order instead of counting a failure
      if (mainOk && missingMods.length) {
        setFlash(null)
        setCoachTip(
          t('trainer.holdThenMain', {
            mods: missingMods.map(displayKey).join(' + '),
            main: displayKey(main ?? ''),
          }),
        )
        return
      }

      const nextMistakes = mistakesRef.current + 1
      let tip: string
      if (main && got.main === 'E' && main === 'Y') {
        tip = t('hotkeys.yNotU')
      } else if (nextMistakes === 1) {
        tip = modifiers.length
          ? t('trainer.hintStartWith', { key: displayKey(modifiers[0]!) })
          : t('trainer.softFirst')
      } else if (nextMistakes === 2) {
        tip = t('trainer.hintSteps', {
          mods: modifiers.map(displayKey).join(' + ') || '—',
          main: displayKey(main ?? ''),
        })
      } else {
        tip = explainMismatch(normalizedKeys, chord, t)
      }
      bumpMistake(tip)
    },
    [
      bumpMistake,
      coached,
      disabled,
      done,
      main,
      mode,
      modifiers,
      normalizedKeys,
      onResult,
      practiceKeys,
      raiseHint,
      succeed,
      t,
    ],
  )

  const evaluate = useCallback(
    (e: KeyboardEvent) => {
      if (disabled || done) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (!boxRef.current?.contains(e.target)) return
      }

      heldMods.current = heldModifiersFromEvent(e)
      e.preventDefault()
      e.stopPropagation()

      const held = heldMods.current
      const mods = modifiersFromEvent(e)
      const mainKey = mainKeyFromEvent(e)
      const rawChord = chordFromEvent(e, held)
      const fallback = rawChord.length ? rawChord : mainKey ? [...mods, mainKey] : mods
      evaluateChord(sanitizeChordForMatch(fallback, practiceKeys))
    },
    [disabled, done, evaluateChord, practiceKeys],
  )

  const onVirtualKey = useCallback(
    (key: string) => {
      if (disabled || done) return
      focusBox()
      if (isModifierKey(key)) {
        const name = key as keyof HeldModifiers
        const nextDown = !heldMods.current[name]
        heldMods.current = { ...heldMods.current, [name]: nextDown }
        const chord = (['Control', 'Shift', 'Alt', 'Meta'] as const).filter((m) => heldMods.current[m])
        setLiveChord(chord)
        if (nextDown && heldModifiersAreExpected(chord, modifiers)) {
          setFlash(null)
          setCoachTip(t('trainer.holdMods', { main: displayKey(main ?? '') }))
        } else if (!nextDown) {
          setCoachTip(null)
        }
        return
      }
      const mods = (['Control', 'Shift', 'Alt', 'Meta'] as const).filter((m) => heldMods.current[m])
      if (modifiers.length && mods.length === 0) {
        setLiveChord([key])
        setFlash(null)
        setCoachTip(
          t('trainer.holdThenMain', {
            mods: modifiers.map(displayKey).join(' + '),
            main: displayKey(main ?? key),
          }),
        )
        return
      }
      evaluateChord([...mods, key])
      heldMods.current = {}
    },
    [disabled, done, evaluateChord, focusBox, main, modifiers, t],
  )

  useEffect(() => {
    if (disabled || done) return
    const id = window.setTimeout(() => boxRef.current?.focus(), 80)
    return () => window.clearTimeout(id)
  }, [disabled, done, actionPrompt, normalizedKeys])

  useEffect(() => {
    if (disabled || done) return
    const onKeyDown = (e: KeyboardEvent) => {
      const insideTrainer = Boolean(boxRef.current?.contains(document.activeElement))
      // Let the learner operate hint/skip buttons with the keyboard
      if (insideTrainer && document.activeElement !== boxRef.current) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') return
      }

      heldMods.current = heldModifiersFromEvent(e)
      const chord = sanitizeChordForMatch(chordFromEvent(e, heldMods.current), practiceKeys)
      const isTargetChord = matchesShortcutKeys(normalizedKeys, chord)
      const isDestructive = isDestructiveBrowserEvent(e, heldMods.current)

      if (insideTrainer || isTargetChord || isDestructive || e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (isDestructive) {
        setCoachTip(t('trainer.closeBlocked', { practice: formatShortcut(practiceKeys) }))
        setFlash('err')
        window.setTimeout(() => setFlash(null), 600)
        return
      }

      if (!insideTrainer) {
        if (isTargetChord) {
          boxRef.current?.focus()
          setCoachTip(t('trainer.clickToStart'))
        }
        return
      }

      evaluate(e)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      heldMods.current = heldModifiersFromEvent(e)
      setLiveChord(sanitizeChordForMatch(chordFromEvent(e, heldMods.current), practiceKeys))
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [disabled, done, evaluate, normalizedKeys, practiceKeys, t])

  const modsReady = allExpectedModifiersHeld(liveChord, modifiers)

  // Green check only for held modifiers that belong to the chord — not a lone letter press
  const checkedKeys = practiceKeys.filter((k) => {
    if (!liveChord.some((c) => c.toLowerCase() === k.toLowerCase())) return false
    if (isModifierKey(k)) return true
    return modsReady || done
  })

  const mystery = hintLevel === 0 && !done
  const revealedKeys =
    done || hintLevel >= 2 ? practiceKeys : hintLevel === 1 ? [modifiers[0] ?? practiceKeys[0]!] : []
  const highlightKeys =
    hintLevel >= 1 && modifiers[0] && !modsReady
      ? [modifiers[0]]
      : !done && liveChord.length
        ? keysForActiveHighlight(liveChord, practiceKeys)
        : hintLevel >= 2
          ? practiceKeys
          : undefined

  // Exactly one helper line under the keys: coaching wins, otherwise the basic how-to
  const helperLine =
    coachTip ??
    (mode === 'exam'
      ? t('trainer.examHint')
      : modifiers.length && !mystery
        ? t('trainer.tapOrderHint', { mods: modifiers.map(displayKey).join(' + ') })
        : t('trainer.pressShortcut'))
  const extraState = demoExtraState(demoKind, done)

  const requestHint = () => {
    askedRef.current = true
    const next = Math.min(hintLevel + 1, 3) as HintLevel
    raiseHint(next)
    if (next === 1 && modifiers.length) {
      setCoachTip(t('trainer.hintStartWith', { key: displayKey(modifiers[0]!) }))
    } else if (next === 2) {
      setCoachTip(
        t('trainer.hintSteps', {
          mods: modifiers.map(displayKey).join(' + ') || '—',
          main: displayKey(main ?? ''),
        }),
      )
    } else {
      setCoachTip(t('trainer.pressAsShown', { shortcut: formatShortcut(practiceKeys) }))
    }
    setFlash(null)
    focusBox()
  }

  const revealAnswer = () => {
    askedRef.current = true
    raiseHint(3)
    setCoachTip(t('trainer.pressAsShown', { shortcut: formatShortcut(practiceKeys) }))
    setFlash(null)
    focusBox()
  }

  const frontContent = (
    <>
      {compact ? null : (
      <AnimatePresence mode="wait">
        <motion.div
          key={titleText}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {labelText ? (
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
                  {labelText}
                </p>
              ) : null}
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
                {titleText}
              </h2>
              {whyText ? <p className="text-muted mt-1 text-sm leading-snug">{whyText}</p> : null}
            </div>
            {coached && !done ? (
              <span
                className="mt-2 flex shrink-0 items-center gap-1"
                aria-label={t('trainer.attempts', { n: mistakes })}
              >
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      mistakes > i ? 'bg-amber-500' : 'bg-[var(--border-default)]',
                    )}
                  />
                ))}
              </span>
            ) : null}
          </div>
        </motion.div>
      </AnimatePresence>
      )}

      {showDemo && (
        <div
          className={cn(
            'km-demo-field mt-4 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-muted)] p-3',
            fill && 'mt-0 w-full p-3',
          )}
        >
          <p className={cn('text-muted mb-2 text-xs', fill && 'mb-3 text-sm')}>{t('trainer.demoField')}</p>
          <div
            className={cn(
              'min-h-[2.75rem] rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 text-sm',
              fill && 'min-h-[3.25rem] p-3 text-base leading-relaxed',
            )}
          >
            {demoText ? (
              <>
                {demoSelectionVisible(demoKind, done) ? (
                  <mark className="rounded bg-sky-300/70 px-0.5 text-slate-900 dark:bg-sky-500/40 dark:text-slate-100">
                    {demoText}
                  </mark>
                ) : (
                  <span>{demoText}</span>
                )}
                {extraState !== 'hidden' ? (
                  <span
                    className={cn(
                      'ml-1 rounded px-0.5',
                      extraState === 'typed' &&
                        'bg-amber-300/80 text-slate-900 dark:bg-amber-500/40 dark:text-slate-100',
                      extraState === 'ghost' &&
                        'text-[var(--text-muted)] line-through decoration-[var(--text-muted)] opacity-60',
                      extraState === 'restored' &&
                        'bg-emerald-300/80 text-slate-900 dark:bg-emerald-500/40 dark:text-slate-100',
                    )}
                  >
                    {t('trainer.demoChange')}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="italic text-[var(--text-muted)]">{t('trainer.textCut')}</span>
            )}
          </div>
          {(demoKind === 'undo' || demoKind === 'redo') && !done ? (
            <p className={cn('text-muted mt-2 text-xs leading-snug', fill && 'mt-2 text-sm')}>
              {demoKind === 'undo' ? t('trainer.undoHint') : t('trainer.redoHint')}
            </p>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          'km-key-stage mt-5 rounded-2xl border px-4 py-6 transition-colors',
          compact && 'mt-0 py-4',
          fill && 'mt-3 w-full px-8 py-4 md:px-12 md:py-5',
          flash === 'err'
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-[var(--border-default)] bg-[var(--bg-muted)]',
        )}
      >
        <KeyCombo
          keys={practiceKeys}
          mystery={mystery}
          checkedKeys={checkedKeys}
          revealedKeys={revealedKeys}
          activeKeys={highlightKeys}
          learned={done}
          size={compact && !fill ? 'md' : 'lg'}
          onKeyActivate={mode === 'exam' ? undefined : onVirtualKey}
        />
        {!done ? (
          <p
            className={cn(
              'mt-4 text-center text-sm leading-snug',
              fill && 'mt-3 text-sm',
              flash === 'err'
                ? 'font-medium text-amber-800 dark:text-amber-200'
                : 'text-[var(--text-secondary)]',
            )}
          >
            {!focused ? t('trainer.clickToStart') : helperLine}
          </p>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {coachTip ?? ''}
      </p>

      {(metaBlocked || fnKeyLesson) && !done && coached && (
        <p className="text-muted mt-3 text-center text-xs">
          {t('trainer.browserNoteShort', { practice: formatShortcut(practiceKeys) })}
        </p>
      )}

      {!done && (coached || detail) ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {coached && hintLevel < 3 ? (
              <button
                type="button"
                onClick={hintLevel >= 2 ? revealAnswer : requestHint}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              >
                <HelpCircle className="h-4 w-4" aria-hidden />
                {hintLevel >= 2 ? t('trainer.showAnswer') : t('trainer.showHint')}
              </button>
            ) : null}
            {detail ? (
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--border-default)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                onClick={() => {
                  setFlipped(true)
                  focusBox()
                }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                {t('trainer.flipExplain')}
              </button>
            ) : null}
          </div>
          {onSkip && coached ? (
            <button
              type="button"
              onClick={onSkip}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
            >
              {t('trainer.skip')}
              <SkipForward className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}

      {done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn('mt-5 space-y-1 text-center', fill && 'mt-3 shrink-0 space-y-0.5')}
        >
          <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
            {t('trainer.accepted')}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {demoEffectMessage(practiceKeys, t) ?? (whyText || titleText)}
          </p>
          {detail ? (
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)]">
              {detail}
            </p>
          ) : null}
          {metaBlocked ? (
            <p className="text-muted text-xs">
              {t('trainer.inTrainerWas', { shortcut: formatShortcut(practiceKeys) })}
            </p>
          ) : null}
          {mode !== 'exam' && (
            <button type="button" onClick={reset} className={cn('btn-secondary mt-3', fill && 'mt-2')}>
              {t('trainer.tryAgain')}
            </button>
          )}
        </motion.div>
      )}
    </>
  )

  const backContent = detail ? (
    <div className="flex min-h-full flex-col">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
        {t('trainer.cardBackLabel')}
      </p>
      <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
        {titleText}
      </h2>
      <div className="mt-4 flex justify-center">
        <KeyCombo keys={practiceKeys} learned size="lg" />
      </div>
      <p className="mt-5 flex-1 text-base leading-relaxed text-[var(--text-secondary)] md:text-[1.05rem]">
        {detail}
      </p>
      <button
        type="button"
        onClick={() => {
          setFlipped(false)
          focusBox()
        }}
        className="btn-secondary mt-6 inline-flex w-fit items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        {t('trainer.flipBack')}
      </button>
    </div>
  ) : null

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      role="application"
      aria-label={t('trainer.aria')}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (boxRef.current?.contains(e.relatedTarget as Node | null)) return
        setFocused(false)
      }}
      className={cn(
        'relative rounded-3xl border outline-none transition-colors duration-300',
        fill && 'flex w-full flex-col',
        'focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]',
        focused && !done && 'ring-2 ring-brand-500/40',
        flash === 'ok' && 'border-emerald-500/50 bg-emerald-500/10',
        flash === 'err' && 'border-rose-500/40 bg-rose-500/5',
        !flash && 'border-[var(--border-default)] bg-[var(--bg-elevated)]',
        shake && 'animate-[km-shake_0.4s_ease-in-out]',
      )}
      style={{ perspective: '1400px' }}
    >
      <div
        className={cn(
          'relative grid transition-transform ease-[cubic-bezier(0.4,0.0,0.2,1)]',
          '[transform-style:preserve-3d]',
          fill && 'w-full',
          flipped && detail && '[transform:rotateY(180deg)]',
        )}
        style={{ transitionDuration: '550ms' }}
      >
        <div
          className={cn(
            'col-start-1 row-start-1 rounded-3xl bg-[var(--bg-elevated)] p-5 md:p-8',
            compact && 'p-3 md:p-4',
            fill && 'flex w-full flex-col items-stretch p-2 md:p-3',
            '[backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
            flipped && detail && 'pointer-events-none',
          )}
        >
          {frontContent}
        </div>
        {backContent ? (
          <div
            className={cn(
              'col-start-1 row-start-1 rounded-3xl bg-[var(--bg-elevated)] p-5 md:p-8',
              '[backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]',
              !flipped && 'pointer-events-none',
            )}
          >
            {backContent}
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes km-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}

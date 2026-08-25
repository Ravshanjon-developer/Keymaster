import { getT, type TranslateFn } from '@/shared/i18n'

const MODIFIERS = new Set(['Control', 'Shift', 'Alt', 'Meta'])

const MODIFIER_ALIASES: Record<string, string> = {
  Ctrl: 'Control',
  Control: 'Control',
  Cmd: 'Meta',
  Command: 'Meta',
  Win: 'Meta',
  Windows: 'Meta',
  Option: 'Alt',
  Alt: 'Alt',
  Shift: 'Shift',
  Meta: 'Meta',
}

/** Stable key for chord comparison. */
export function chordKey(keys: string[]): string {
  return [...keys].sort().join('|')
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
}

export function normalizeMainKey(key: string): string {
  if (key === '/') return 'Slash'
  if (key === '`') return 'Backquote'
  if (key === ' ') return 'Space'
  if (key.length === 1) return key.toUpperCase()
  return key
}

/** Normalize lesson/API shortcut tokens to canonical chord parts. */
export function normalizeShortcutKeys(keys: string[]): string[] {
  return keys.map((raw) => {
    const alias = MODIFIER_ALIASES[raw]
    if (alias) return alias
    if (raw === '/' || raw === 'Slash') return 'Slash'
    if (raw === '`' || raw === 'Backquote') return 'Backquote'
    if (raw === 'Space' || raw === ' ') return 'Space'
    if (/^F\d{1,2}$/i.test(raw)) return raw.toUpperCase()
    if (raw.startsWith('Arrow')) return raw
    if (raw.length === 1) return raw.toUpperCase()
    return raw
  })
}

const CODE_TO_MAIN: Record<string, string> = {
  Slash: 'Slash',
  Backquote: 'Backquote',
  Space: 'Space',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  PrintScreen: 'PrintScreen',
  Insert: 'Insert',
  Escape: 'Escape',
  Enter: 'Enter',
  NumpadEnter: 'Enter',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  Minus: 'Minus',
  Equal: 'Equal',
  BracketLeft: 'BracketLeft',
  BracketRight: 'BracketRight',
  Backslash: 'Backslash',
  Semicolon: 'Semicolon',
  Quote: 'Quote',
  Comma: 'Comma',
  Period: 'Period',
}

/** Function keys (F1–F12) — prefer event.code; some browsers send key "Unidentified". */
export function functionKeyFromEvent(event: KeyboardEvent): string | null {
  const code = event.code ?? ''
  const fromCode = code.match(/^(F\d+)$/)
  if (fromCode) return fromCode[1]

  const raw = event.key
  if (/^F\d{1,2}$/i.test(raw)) return raw.toUpperCase()

  const legacy = (event as KeyboardEvent & { keyCode?: number }).keyCode
  if (typeof legacy === 'number' && legacy >= 112 && legacy <= 123) {
    return `F${legacy - 111}`
  }
  return null
}

export function isModifierKey(key: string): boolean {
  return key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta'
}

/** Main key for shortcut matching (layout-safe via event.code). */
export function mainKeyFromEvent(event: KeyboardEvent): string | null {
  const raw = event.key
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(raw)) return null

  const fn = functionKeyFromEvent(event)
  if (fn) return fn

  const named = [
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'PrintScreen',
    'Insert',
  ]
  if (named.includes(raw)) return raw
  if (raw === 'Esc') return 'Escape'

  const code = event.code ?? ''
  // Prefer physical key (KeyY → Y) so Russian «Н» / «У» layouts still match Latin chords.
  const letter = code.match(/^Key([A-Z])$/)
  if (letter) return letter[1]
  const digit = code.match(/^Digit([0-9])$/)
  if (digit) return digit[1]
  const numpad = code.match(/^Numpad([0-9])$/)
  if (numpad) return numpad[1]

  if (code && CODE_TO_MAIN[code]) return CODE_TO_MAIN[code]
  if (code.startsWith('Arrow')) return code

  const fromKey = normalizeMainKey(raw)
  if (fromKey.length === 1 && /[A-Z0-9]/.test(fromKey)) return fromKey

  if (!MODIFIERS.has(fromKey) && fromKey.length > 1) return fromKey
  return null
}

/**
 * Drop phantom Alt (AltGr / sticky Right-Alt on Windows) when the target chord
 * does not use Alt. Otherwise Ctrl+Y is reported as Ctrl+Alt+Y and never matches.
 */
export function sanitizeChordForMatch(pressed: string[], expected: string[]): string[] {
  if (expected.includes('Alt') || !pressed.includes('Alt')) return pressed
  if (pressed.includes('Control') || pressed.includes('Meta')) {
    return pressed.filter((k) => k !== 'Alt')
  }
  return pressed
}

export type HeldModifiers = Partial<Record<'Control' | 'Shift' | 'Alt' | 'Meta', boolean>>

/** Always trust the browser's live modifier flags (avoids sticky Alt after AltGr). */
export function heldModifiersFromEvent(event: KeyboardEvent): HeldModifiers {
  return {
    Control: event.ctrlKey,
    Shift: event.shiftKey,
    Alt: event.altKey,
    Meta: event.metaKey,
  }
}

export function chordFromEvent(event: KeyboardEvent, held: HeldModifiers = {}): string[] {
  const chord: string[] = []
  if (event.ctrlKey || held.Control) chord.push('Control')
  if (event.shiftKey || held.Shift) chord.push('Shift')
  if (event.altKey || held.Alt) chord.push('Alt')
  if (event.metaKey || held.Meta) chord.push('Meta')

  const main = mainKeyFromEvent(event)
  if (main) chord.push(main)
  return chord
}

export function matchesShortcutKeys(expectedRaw: string[], pressed: string[]): boolean {
  const expected = normalizeShortcutKeys(expectedRaw)
  const practice = webPracticeKeys(expected)
  const cleaned = sanitizeChordForMatch(pressed, practice.length ? practice : expected)
  const normalized = normalizeChordForMatch(cleaned, practice)

  if (sameSet(practice, normalized) || sameSet(practice, cleaned)) return true

  const realNorm = normalizeChordForMatch(cleaned, expected)
  if (sameSet(expected, realNorm) || sameSet(expected, cleaned)) return true

  if (sameSet(practice, normalizeChordForMatch(cleaned, expected))) return true

  return false
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return chordKey(a) === chordKey(b)
}

/** Map Meta→Control when the expected chord uses Control (Mac users on Windows courses). */
export function normalizeChordForMatch(pressed: string[], expected: string[]): string[] {
  const wantsControl = expected.includes('Control') && !expected.includes('Meta')
  if (!wantsControl) return pressed
  const mapped = pressed.map((k) => (k === 'Meta' ? 'Control' : k))
  return [...new Set(mapped)]
}

export function keysForActiveHighlight(pressed: string[], displayKeys: string[]): string[] {
  if (!pressed.length) return pressed
  return normalizeChordForMatch(pressed, displayKeys)
}

export function usesMetaKey(keys: string[]): boolean {
  return keys.includes('Meta')
}

/**
 * Chords remapped for in-browser practice when OS/browser steals the real shortcut.
 * Keys must already be normalized.
 */
const EXACT_BROWSER_REMAP: Record<string, string[]> = {
  'Alt|Tab': ['Control', 'Tab'],
  'Alt|F4': ['Control', 'Shift', 'F4'],
  'Control|W': ['Control', 'Alt', 'W'],
  'Control|Escape|Shift': ['Control', 'Shift', 'E'],
  'Alt|ArrowLeft': ['Control', 'Shift', 'ArrowLeft'],
  'Alt|ArrowRight': ['Control', 'Shift', 'ArrowRight'],
  'Alt|Enter': ['Control', 'Enter'],
  'Alt|D': ['Control', 'L'],
  'Alt|ArrowUp': ['Control', 'ArrowUp'],
  'Alt|ArrowDown': ['Control', 'ArrowDown'],
  'Control|N|Shift': ['Control', 'Alt', 'N'],
  'Meta|S': ['Control', 'Shift', 'Space'],
  'Meta|V': ['Control', 'Shift', 'V'],
  'Meta|I': ['Control', 'Comma'],
  // F-keys: browser/OS/laptop hardware (flight mode, Wi‑Fi) often block the real key
  F1: ['Control', 'Shift', '1'],
  F10: ['Control', 'Shift', '0'],
  F11: ['Control', 'Shift', 'J'],
  F12: ['Control', 'Shift', 'I'],
}

function remapMetaToControl(keys: string[]): string[] {
  const mapped = keys.map((k) => (k === 'Meta' ? 'Control' : k))
  return [...new Set(mapped)]
}

export function shortcutUsesFunctionKey(keys: string[]): boolean {
  return normalizeShortcutKeys(keys).some((k) => /^F\d+$/.test(k))
}

export function isStandaloneFunctionKey(keys: string[]): boolean {
  const normalized = normalizeShortcutKeys(keys)
  return normalized.length === 1 && /^F\d+$/.test(normalized[0] ?? '')
}

/** Shortcuts Windows/macOS/browser often steal before the page can see them. */
export function isOsCapturedShortcut(keys: string[]): boolean {
  const normalized = normalizeShortcutKeys(keys)
  return chordKey(normalized) !== chordKey(webPracticeKeys(normalized))
}

/**
 * Keys the student should press IN THE BROWSER.
 * OS-stolen chords are remapped so training still works.
 */
export function webPracticeKeys(keys: string[]): string[] {
  const normalized = normalizeShortcutKeys(keys)
  const exact = EXACT_BROWSER_REMAP[chordKey(normalized)]
  if (exact) return exact

  if (!isMacPlatform() && normalized.includes('Meta')) {
    return remapMetaToControl(normalized)
  }

  return normalized
}

export function matchesShortcut(expectedRaw: string[], event: KeyboardEvent, held: HeldModifiers = {}): boolean {
  if (event.repeat) return false
  return matchesShortcutKeys(expectedRaw, chordFromEvent(event, held))
}

/** Modifier keys currently held (from event flags — reliable on keyup). */
export function modifiersFromEvent(event: KeyboardEvent): string[] {
  const mods: string[] = []
  if (event.ctrlKey) mods.push('Control')
  if (event.shiftKey) mods.push('Shift')
  if (event.altKey) mods.push('Alt')
  if (event.metaKey) mods.push('Meta')
  return mods
}

export function displayKey(label: string): string {
  const map: Record<string, string> = {
    Control: 'Ctrl',
    Meta: isMacPlatform() ? 'Cmd' : 'Win',
    Slash: '/',
    Backquote: '`',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Backspace: 'Backspace',
    Delete: 'Delete',
    PageUp: 'Page Up',
    PageDown: 'Page Down',
    PrintScreen: 'PrtSc',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    Tab: 'Tab',
    Escape: 'Esc',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Comma: ',',
    Period: '.',
  }
  return map[label] ?? label
}

export function formatShortcut(keys: string[]): string {
  return normalizeShortcutKeys(keys).map(displayKey).join(' + ')
}

export function chordDisplay(chord: string[]): string {
  if (chord.length === 0) return '—'
  return formatShortcut(chord)
}

export function splitShortcut(keys: string[]): { modifiers: string[]; main: string | null } {
  const normalized = normalizeShortcutKeys(keys)
  const modifiers = normalized.filter((k) => MODIFIERS.has(k))
  const main = normalized.find((k) => !MODIFIERS.has(k)) ?? null
  return { modifiers, main }
}

/** True when every held modifier is part of the expected chord (no extras). */
export function heldModifiersAreExpected(pressed: string[], expectedMods: string[]): boolean {
  const held = pressed.filter((k) => MODIFIERS.has(k))
  if (!held.length) return false
  if (!expectedMods.length) return false
  return held.every((m) => expectedMods.includes(m))
}

/** True when all required modifiers are currently held. */
export function allExpectedModifiersHeld(pressed: string[], expectedMods: string[]): boolean {
  if (!expectedMods.length) return true
  return expectedMods.every((m) => pressed.includes(m))
}

export type DemoEditorKind = 'select-all' | 'cut' | 'copy' | 'paste' | 'undo' | 'redo'

export function demoEditorKind(keys: string[]): DemoEditorKind | null {
  const practice = webPracticeKeys(keys)
  const set = new Set(practice.map((k) => k.toUpperCase()))
  if (!set.has('CONTROL')) return null
  const letter = practice.find((k) => k.length === 1)?.toUpperCase() ?? ''
  switch (letter) {
    case 'A':
      return 'select-all'
    case 'X':
      return 'cut'
    case 'C':
      return 'copy'
    case 'V':
      return 'paste'
    case 'Z':
      return 'undo'
    case 'Y':
      return 'redo'
    default:
      return null
  }
}

export function needsDemoEditor(keys: string[]): boolean {
  return demoEditorKind(keys) !== null
}

/** Copy/cut start with a selection; select-all only highlights after a correct press. */
export function demoSelectionVisible(kind: DemoEditorKind | null, done: boolean): boolean {
  if (kind === 'select-all') return done
  if (kind === 'copy') return true
  if (kind === 'cut') return !done
  return false
}

/** Typed fragment in the demo field: undo removes it, redo brings it back. */
export type DemoExtraState = 'hidden' | 'typed' | 'ghost' | 'restored'

export function demoExtraState(kind: DemoEditorKind | null, done: boolean): DemoExtraState {
  if (kind === 'undo') return done ? 'ghost' : 'typed'
  if (kind === 'redo') return done ? 'restored' : 'ghost'
  return 'hidden'
}

export function explainMismatch(
  expectedRaw: string[],
  pressed: string[],
  translate?: TranslateFn,
): string {
  const t = translate ?? getT()
  const expected = normalizeShortcutKeys(expectedRaw)
  const target = isOsCapturedShortcut(expected) ? webPracticeKeys(expected) : expected
  pressed = sanitizeChordForMatch(pressed, target)
  const exp = splitShortcut(target)
  const got = splitShortcut(pressed)
  const missingMods = exp.modifiers.filter((m) => !pressed.includes(m))
  const extraMods = got.modifiers.filter((m) => !target.includes(m))

  if (pressed.length === 1 && MODIFIERS.has(pressed[0])) {
    if (exp.modifiers.includes(pressed[0])) {
      return t('hotkeys.holdThen', { key: displayKey(pressed[0]), main: displayKey(exp.main ?? '') })
    }
    return t('hotkeys.wrongMods', {
      got: displayKey(pressed[0]),
      need: exp.modifiers.map(displayKey).join(' + ') || formatShortcut(target),
      target: formatShortcut(target),
    })
  }
  if (extraMods.length && (missingMods.length || (got.main && exp.main && got.main !== exp.main))) {
    return t('hotkeys.wrongChord', {
      got: formatShortcut(pressed),
      target: formatShortcut(target),
    })
  }
  if (missingMods.length && !got.main) {
    return t('hotkeys.holdFirst', {
      mods: missingMods.map(displayKey).join(' + '),
      main: displayKey(exp.main ?? ''),
    })
  }
  if (missingMods.length) {
    return t('hotkeys.missing', {
      mods: missingMods.map(displayKey).join(' + '),
      target: formatShortcut(target),
    })
  }
  if (extraMods.length) {
    return t('hotkeys.extra', {
      mods: extraMods.map(displayKey).join(' + '),
      target: formatShortcut(target),
    })
  }
  if (got.main && exp.main && got.main !== exp.main) {
    // Latin Y vs Cyrillic «У» (physical KeyE) — the most common RU layout mix-up
    if (exp.main === 'Y' && got.main === 'E') {
      return t('hotkeys.yNotU')
    }
    return t('hotkeys.wrongMain', { need: displayKey(exp.main), got: displayKey(got.main) })
  }
  return t('hotkeys.wrong', { target: formatShortcut(target) })
}

export type TrainerMode = 'learn' | 'practice' | 'exam'

export function isBrowserHostileForTraining(keys: string[]): boolean {
  const normalized = normalizeShortcutKeys(keys)
  if (usesMetaKey(normalized)) return true
  if (shortcutUsesFunctionKey(normalized)) return true
  if (normalized.includes('PrintScreen')) return true
  if (isOsCapturedShortcut(normalized)) return true
  return false
}


export function browserPracticePair(keys: string[]): { system: string[]; practice: string[] } {
  const system = normalizeShortcutKeys(keys)
  return { system, practice: webPracticeKeys(system) }
}

const DESTRUCTIVE_BROWSER_CHORDS = new Set(
  [
    ['Control', 'W'],
    ['Control', 'F4'],
    ['Control', 'Shift', 'W'],
    ['Alt', 'F4'],
    ['Meta', 'W'],
  ].map((c) => chordKey(c)),
)

/** Chords that close tab/window — must be blocked while the trainer is active. */
export function isDestructiveBrowserShortcut(keys: string[]): boolean {
  return DESTRUCTIVE_BROWSER_CHORDS.has(chordKey(normalizeShortcutKeys(keys)))
}

export function isDestructiveBrowserEvent(event: KeyboardEvent, held: HeldModifiers = {}): boolean {
  return isDestructiveBrowserShortcut(chordFromEvent(event, held))
}

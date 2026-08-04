import { getT, type TranslateFn } from '@/shared/i18n'

const MODIFIERS = new Set(['Control', 'Shift', 'Alt', 'Meta'])

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)
}

export function normalizeMainKey(key: string): string {
  if (key === '/') return 'Slash'
  if (key === '`') return 'Backquote'
  if (key === ' ') return 'Space'
  if (key.length === 1) return key.toUpperCase()
  // Normalize common aliases
  if (key === ' ') return 'Space'
  return key
}

/** Main key for shortcut matching (layout-safe via event.code). */
export function mainKeyFromEvent(event: KeyboardEvent): string | null {
  const raw = event.key
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(raw)) return null

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
  if (/^F\d{1,2}$/.test(raw)) return raw

  const fromKey = normalizeMainKey(raw)
  if (fromKey.length === 1 && /[A-Z0-9]/.test(fromKey)) return fromKey

  const code = event.code
  const letter = code.match(/^Key([A-Z])$/)
  if (letter) return letter[1]
  const digit = code.match(/^Digit([0-9])$/)
  if (digit) return digit[1]

  if (code === 'Slash') return 'Slash'
  if (code === 'Backquote') return 'Backquote'
  if (code === 'Space') return 'Space'
  if (code === 'Tab') return 'Tab'
  if (code === 'Backspace') return 'Backspace'
  if (code === 'Delete') return 'Delete'
  if (code === 'Home') return 'Home'
  if (code === 'End') return 'End'
  if (code === 'PageUp') return 'PageUp'
  if (code === 'PageDown') return 'PageDown'
  if (code === 'PrintScreen') return 'PrintScreen'
  if (code === 'Escape') return 'Escape'
  if (code.startsWith('Arrow')) return code
  if (/^F\d+$/.test(code)) return code

  if (!MODIFIERS.has(fromKey) && fromKey.length > 1) return fromKey
  return null
}

export function chordFromEvent(event: KeyboardEvent): string[] {
  const chord: string[] = []
  if (event.ctrlKey) chord.push('Control')
  if (event.shiftKey) chord.push('Shift')
  if (event.altKey) chord.push('Alt')
  if (event.metaKey) chord.push('Meta')

  const main = mainKeyFromEvent(event)
  if (main) chord.push(main)
  return chord
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return [...a].sort().join('|') === [...b].sort().join('|')
}

export function usesMetaKey(keys: string[]): boolean {
  return keys.includes('Meta')
}

/** Shortcuts Windows/macOS often steal before the page can see them. */
export function isOsCapturedShortcut(keys: string[]): boolean {
  if (usesMetaKey(keys)) return true
  const sorted = [...keys].sort().join('|')
  return (
    sorted === 'Alt|Tab' ||
    sorted === 'Alt|F4' ||
    // Windows opens Task Manager — browser never sees Escape
    sorted === 'Control|Escape|Shift'
  )
}

/**
 * Keys the student should press IN THE BROWSER.
 * OS-stolen chords are remapped so training still works.
 */
export function webPracticeKeys(keys: string[]): string[] {
  const sorted = [...keys].sort().join('|')
  if (sorted === 'Alt|Tab') return ['Control', 'Tab']
  if (sorted === 'Alt|F4') return ['Control', 'F4']
  // Esc ≈ E — Windows steals Ctrl+Shift+Esc for Task Manager
  if (sorted === 'Control|Escape|Shift') return ['Control', 'Shift', 'E']
  return keys.map((k) => (k === 'Meta' ? 'Control' : k))
}

export function matchesShortcut(expected: string[], event: KeyboardEvent): boolean {
  if (event.repeat) return false
  const pressed = chordFromEvent(event)
  const practice = webPracticeKeys(expected)
  // Prefer browser-reachable practice chord; also accept real chord if OS lets it through
  if (sameSet(practice, pressed)) return true
  if (!sameSet(practice, expected) && sameSet(expected, pressed)) return true
  return false
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
    Home: 'Home',
    End: 'End',
    Tab: 'Tab',
    Escape: 'Esc',
  }
  return map[label] ?? label
}

export function formatShortcut(keys: string[]): string {
  return keys.map(displayKey).join(' + ')
}

export function chordDisplay(chord: string[]): string {
  if (chord.length === 0) return '—'
  return formatShortcut(chord)
}

export function splitShortcut(keys: string[]): { modifiers: string[]; main: string | null } {
  const modifiers = keys.filter((k) => MODIFIERS.has(k))
  const main = keys.find((k) => !MODIFIERS.has(k)) ?? null
  return { modifiers, main }
}

export function needsDemoEditor(keys: string[]): boolean {
  const practice = webPracticeKeys(keys)
  const set = new Set(practice.map((k) => k.toUpperCase()))
  const hasMod = set.has('CONTROL')
  const letter = practice.find((k) => k.length === 1)
  return hasMod && ['X', 'C', 'V', 'Z', 'Y', 'A'].includes(letter ?? '')
}

export function explainMismatch(
  expected: string[],
  pressed: string[],
  translate?: TranslateFn,
): string {
  const t = translate ?? getT()
  const target = isOsCapturedShortcut(expected) ? webPracticeKeys(expected) : expected
  const exp = splitShortcut(target)
  const got = splitShortcut(pressed)
  const missingMods = exp.modifiers.filter((m) => !pressed.includes(m))
  const extraMods = got.modifiers.filter((m) => !target.includes(m))

  if (pressed.length === 1 && MODIFIERS.has(pressed[0])) {
    return t('hotkeys.holdThen', { key: displayKey(pressed[0]), main: displayKey(exp.main ?? '') })
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
    return t('hotkeys.wrongMain', { need: displayKey(exp.main), got: displayKey(got.main) })
  }
  return t('hotkeys.wrong', { target: formatShortcut(target) })
}

export type TrainerMode = 'learn' | 'practice' | 'exam'

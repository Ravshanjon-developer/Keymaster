import { describe, expect, it } from 'vitest'

import {
  allExpectedModifiersHeld,
  chordFromEvent,
  chordKey,
  explainMismatch,
  functionKeyFromEvent,
  heldModifiersAreExpected,
  isBrowserHostileForTraining,
  mainKeyFromEvent,
  matchesShortcut,
  matchesShortcutKeys,
  normalizeShortcutKeys,
  webPracticeKeys,
} from '@/shared/lib/hotkeys'

function keyEvent(partial: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    repeat: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    key: '',
    code: '',
    ...partial,
  } as KeyboardEvent
}

describe('normalizeShortcutKeys', () => {
  it('normalizes modifier aliases', () => {
    expect(normalizeShortcutKeys(['Ctrl', 'Shift', 'n'])).toEqual(['Control', 'Shift', 'N'])
  })
})

describe('webPracticeKeys', () => {
  it('remaps Ctrl+Shift+Esc to Ctrl+Shift+E', () => {
    expect(chordKey(webPracticeKeys(['Control', 'Shift', 'Escape']))).toBe(
      chordKey(['Control', 'Shift', 'E']),
    )
  })

  it('remaps Win+E to Ctrl+E on Windows-style chords', () => {
    expect(chordKey(webPracticeKeys(['Meta', 'E']))).toBe(chordKey(['Control', 'E']))
  })

  it('remaps Alt+Tab to Ctrl+Tab', () => {
    expect(chordKey(webPracticeKeys(['Alt', 'Tab']))).toBe(chordKey(['Control', 'Tab']))
  })

  it('remaps Alt+F4 to Ctrl+Shift+F4 (not Ctrl+F4 — that closes the tab)', () => {
    expect(chordKey(webPracticeKeys(['Alt', 'F4']))).toBe(chordKey(['Control', 'Shift', 'F4']))
  })

  it('remaps Ctrl+W to Ctrl+Alt+W for safe browser practice', () => {
    expect(chordKey(webPracticeKeys(['Control', 'W']))).toBe(chordKey(['Control', 'Alt', 'W']))
  })

  it('remaps Alt+ArrowLeft for browser back steal', () => {
    expect(chordKey(webPracticeKeys(['Alt', 'ArrowLeft']))).toBe(
      chordKey(['Control', 'Shift', 'ArrowLeft']),
    )
  })

  it('remaps F12 to Ctrl+Shift+I for browser training', () => {
    expect(chordKey(webPracticeKeys(['F12']))).toBe(chordKey(['Control', 'Shift', 'I']))
  })

  it('matches Ctrl+Shift+I when lesson is F12', () => {
    expect(
      matchesShortcutKeys(['F12'], ['Control', 'Shift', 'I']),
    ).toBe(true)
  })
})

describe('matchesShortcut', () => {
  it('matches Meta+C as Control+C', () => {
    const event = keyEvent({ metaKey: true, key: 'c', code: 'KeyC' })
    expect(matchesShortcut(['Control', 'C'], event)).toBe(true)
  })

  it('matches practice chord Win+E as Ctrl+E', () => {
    const event = keyEvent({ ctrlKey: true, key: 'e', code: 'KeyE' })
    expect(matchesShortcut(['Meta', 'E'], event)).toBe(true)
  })

  it('matches Ctrl+Alt+N when lesson is Ctrl+Shift+N', () => {
    const event = keyEvent({ ctrlKey: true, altKey: true, key: 'n', code: 'KeyN' })
    expect(matchesShortcut(['Control', 'Shift', 'N'], event)).toBe(true)
  })

  it('matches Slash main key via code', () => {
    const event = keyEvent({ ctrlKey: true, key: '/', code: 'Slash' })
    expect(matchesShortcut(['Control', 'Slash'], event)).toBe(true)
  })

  it('matches F12', () => {
    const event = keyEvent({ key: 'F12', code: 'F12' })
    expect(matchesShortcut(['F12'], event)).toBe(true)
  })

  it('matches Shift+F9 when shift is tracked as held (Fn keyboards)', () => {
    const event = keyEvent({ key: 'Unidentified', code: 'F9', shiftKey: false })
    expect(matchesShortcutKeys(['Shift', 'F9'], chordFromEvent(event, { Shift: true }))).toBe(true)
  })

  it('reads F9 from code when key is Unidentified', () => {
    const event = keyEvent({ key: 'Unidentified', code: 'F9' })
    expect(functionKeyFromEvent(event)).toBe('F9')
    expect(mainKeyFromEvent(event)).toBe('F9')
  })
})

describe('mainKeyFromEvent', () => {
  it('reads arrow keys from code when key is empty', () => {
    const event = keyEvent({ altKey: true, key: 'ArrowLeft', code: 'ArrowLeft' })
    expect(mainKeyFromEvent(event)).toBe('ArrowLeft')
  })
})

describe('modifier coaching helpers', () => {
  it('does not treat Alt as a correct hold for Ctrl+S', () => {
    expect(heldModifiersAreExpected(['Alt'], ['Control'])).toBe(false)
    expect(heldModifiersAreExpected(['Control'], ['Control'])).toBe(true)
    expect(allExpectedModifiersHeld(['Alt', 'PrintScreen'], ['Control'])).toBe(false)
    expect(allExpectedModifiersHeld(['Control'], ['Control'])).toBe(true)
  })

  it('rejects Alt+PrtSc for Ctrl+S and explains wrong chord', () => {
    expect(matchesShortcutKeys(['Control', 'S'], ['Alt', 'PrintScreen'])).toBe(false)
    const tip = explainMismatch(['Control', 'S'], ['Alt', 'PrintScreen'], ((key: string) => key) as never)
    expect(tip).toContain('hotkeys.wrongChord')
  })
})

describe('isBrowserHostileForTraining', () => {
  it('flags F-keys, Alt+Tab, Meta and PrintScreen', () => {
    expect(isBrowserHostileForTraining(['F12'])).toBe(true)
    expect(isBrowserHostileForTraining(['Alt', 'Tab'])).toBe(true)
    expect(isBrowserHostileForTraining(['Meta', 'E'])).toBe(true)
    expect(isBrowserHostileForTraining(['PrintScreen'])).toBe(true)
  })

  it('allows everyday Ctrl chords', () => {
    expect(isBrowserHostileForTraining(['Control', 'C'])).toBe(false)
    expect(isBrowserHostileForTraining(['Control', 'S'])).toBe(false)
    expect(isBrowserHostileForTraining(['Home'])).toBe(false)
  })
})

describe('layout-safe matching', () => {
  it('treats Russian layout KeyY (key н) as Y', () => {
    const event = keyEvent({ ctrlKey: true, key: 'н', code: 'KeyY' })
    expect(mainKeyFromEvent(event)).toBe('Y')
    expect(matchesShortcut(['Control', 'Y'], event)).toBe(true)
  })

  it('does not treat Cyrillic У (KeyE) as Y', () => {
    const event = keyEvent({ ctrlKey: true, key: 'у', code: 'KeyE' })
    expect(mainKeyFromEvent(event)).toBe('E')
    expect(matchesShortcut(['Control', 'Y'], event)).toBe(false)
  })

  it('ignores phantom Alt when matching Ctrl+Y', () => {
    expect(matchesShortcutKeys(['Control', 'Y'], ['Control', 'Alt', 'Y'])).toBe(true)
  })

  it('explains Y vs У mix-up', () => {
    expect(explainMismatch(['Control', 'Y'], ['Control', 'E'])).toMatch(/Н|Y/)
  })
})

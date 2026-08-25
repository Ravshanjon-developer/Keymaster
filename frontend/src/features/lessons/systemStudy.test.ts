import { describe, expect, it } from 'vitest'

import {
  isProgrammerSystemCategory,
  mergeSystemStudyTicks,
  systemExplainId,
  systemShortcutLabel,
} from './systemStudy'

describe('system study helpers', () => {
  it('detects the programmer-basics system category', () => {
    expect(isProgrammerSystemCategory('programmer-basics', 'system')).toBe(true)
    expect(isProgrammerSystemCategory('programmer-basics', 'basics')).toBe(false)
    expect(isProgrammerSystemCategory('windows', 'system')).toBe(false)
  })

  it('maps OS-stolen chords to explanation ids', () => {
    expect(systemExplainId(['Alt', 'Tab'])).toBe('systemExplainAltTab')
    expect(systemExplainId(['Alt', 'F4'])).toBe('systemExplainAltF4')
    expect(systemExplainId(['Meta', 'D'])).toBe('systemExplainWinD')
    expect(systemExplainId(['Meta', 'E'])).toBe('systemExplainWinE')
    expect(systemExplainId(['PrintScreen'])).toBe('systemExplainPrtSc')
    expect(systemExplainId(['Meta', 'Shift', 'S'])).toBe('systemExplainWinShiftS')
    expect(systemExplainId(['Control', 'C'])).toBe(null)
  })

  it('labels Win chords for the table', () => {
    expect(systemShortcutLabel(['Meta', 'D'])).toMatch(/Win|Cmd/)
    expect(systemShortcutLabel(['Alt', 'Tab'])).toBe('Alt + Tab')
  })

  it('keeps checked items when switching lessons and only adds completed ones', () => {
    expect(
      mergeSystemStudyTicks(
        ['a', 'b', 'c'],
        { a: true, b: true },
        { c: true },
      ),
    ).toEqual({ a: true, b: true, c: true })
    expect(mergeSystemStudyTicks(['a', 'b'], { a: true }, {})).toEqual({ a: true, b: false })
  })
})

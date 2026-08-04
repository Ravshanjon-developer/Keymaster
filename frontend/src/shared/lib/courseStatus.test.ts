import { describe, expect, it } from 'vitest'

import { getCourseStatus } from '@/shared/lib/courseStatus'
import {
  normalizeChordForMatch,
  webPracticeKeys,
  matchesShortcut,
} from '@/shared/lib/hotkeys'
import { UNLOCK_PERCENT } from '@/features/path/growthPath'

describe('getCourseStatus', () => {
  it('returns a single completed status at 100%', () => {
    expect(getCourseStatus({ percent: 100, isStartCourse: true })).toBe('completed')
  })

  it('returns in_progress and hides start badge', () => {
    expect(getCourseStatus({ percent: 40, isStartCourse: true })).toBe('in_progress')
  })

  it('returns start only when zero progress on start course', () => {
    expect(getCourseStatus({ percent: 0, isStartCourse: true })).toBe('start')
    expect(getCourseStatus({ percent: 0, isStartCourse: false })).toBe('not_started')
  })
})

describe('hotkeys OS remap + Mac Meta', () => {
  it('remaps Ctrl+Shift+Esc to Ctrl+Shift+E for browser practice', () => {
    expect(webPracticeKeys(['Control', 'Shift', 'Escape']).sort()).toEqual(
      ['Control', 'E', 'Shift'].sort(),
    )
  })

  it('maps Meta to Control when matching Windows chords', () => {
    expect(normalizeChordForMatch(['Meta', 'C'], ['Control', 'C']).sort()).toEqual(
      ['Control', 'C'].sort(),
    )
  })

  it('matches Meta+C as Control+C', () => {
    const event = {
      repeat: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: true,
      key: 'c',
      code: 'KeyC',
    } as KeyboardEvent
    expect(matchesShortcut(['Control', 'C'], event)).toBe(true)
  })
})

describe('growth unlock threshold', () => {
  it('uses 60% unlock gate', () => {
    expect(UNLOCK_PERCENT).toBe(60)
  })
})

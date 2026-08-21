import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  desktopSimulatorHref,
  isDesktopTaskDoneLocally,
  parseDesktopTaskId,
  saveDesktopLocalProgress,
  saveTypingBest,
} from './simulatorProgress'

const memory = new Map<string, string>()

beforeEach(() => {
  memory.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value)
    },
    removeItem: (key: string) => {
      memory.delete(key)
    },
    clear: () => memory.clear(),
  })
})

describe('parseDesktopTaskId', () => {
  it('reads desktop task ids and rejects junk', () => {
    expect(parseDesktopTaskId(['desktop:3'])).toBe(3)
    expect(parseDesktopTaskId(['desktop:0'])).toBeNull()
    expect(parseDesktopTaskId(['Control', 'C'])).toBeNull()
    expect(parseDesktopTaskId([])).toBeNull()
  })
})

describe('desktopSimulatorHref', () => {
  it('builds query for task and lesson return', () => {
    expect(desktopSimulatorHref(4, 'abc')).toBe('/simulator?mode=desktop&task=4')
    expect(desktopSimulatorHref(4, 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe(
      '/simulator?mode=desktop&task=4&fromLesson=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    )
    expect(desktopSimulatorHref()).toBe('/simulator?mode=desktop')
  })
})

describe('isDesktopTaskDoneLocally', () => {
  it('reads completed task ids from local progress', () => {
    expect(isDesktopTaskDoneLocally(1)).toBe(false)
    saveDesktopLocalProgress(new Set([1, 3]), 20)
    expect(isDesktopTaskDoneLocally(1)).toBe(true)
    expect(isDesktopTaskDoneLocally(2)).toBe(false)
  })
})

describe('saveTypingBest', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('keeps the higher WPM', () => {
    saveTypingBest({ wpm: 20, accuracy: 90 })
    const next = saveTypingBest({ wpm: 32, accuracy: 88 })
    expect(next.wpm).toBe(32)
    const lower = saveTypingBest({ wpm: 10, accuracy: 99 })
    expect(lower.wpm).toBe(32)
  })
})

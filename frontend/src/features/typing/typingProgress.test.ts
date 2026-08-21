import { beforeEach, describe, expect, it, vi } from 'vitest'

import { commitTypingSession, mergeKeyStats, nextStreak, unlockedStage, weekDailyWpm } from './typingProgress'

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

describe('streak', () => {
  it('starts at 1 and continues on consecutive days', () => {
    expect(nextStreak(0, null, Date.parse('2026-08-21T12:00:00Z'))).toBe(1)
    expect(nextStreak(3, '2026-08-20', Date.parse('2026-08-21T12:00:00Z'))).toBe(4)
    expect(nextStreak(3, '2026-08-18', Date.parse('2026-08-21T12:00:00Z'))).toBe(1)
  })
})

describe('mergeKeyStats', () => {
  it('sums hits and misses instead of overwriting keys', () => {
    expect(
      mergeKeyStats(
        { a: { hits: 5, misses: 1 }, b: { hits: 2, misses: 0 } },
        { a: { hits: 3, misses: 2 }, c: { hits: 1, misses: 1 } },
      ),
    ).toEqual({
      a: { hits: 8, misses: 3 },
      b: { hits: 2, misses: 0 },
      c: { hits: 1, misses: 1 },
    })
  })
})

describe('commitTypingSession', () => {
  it('stores history, unlocks first practice, and opens the next path stage', () => {
    const first = commitTypingSession(
      {
        at: Date.parse('2026-08-21T12:00:00Z'),
        mode: 'practice',
        wpm: 22,
        accuracy: 95,
        errors: 2,
        durationMs: 30_000,
        correct: 80,
        incorrect: 4,
        stage: 'home',
      },
      { а: { hits: 10, misses: 1 } },
    )
    expect(first.store.sessions).toHaveLength(1)
    expect(first.newAchievements).toContain('first_practice')
    expect(first.store.path.home.completed).toBe(1)
    expect(unlockedStage(first.store.path, 'letters')).toBe(true)
    expect(unlockedStage(first.store.path, 'words')).toBe(false)
  })

  it('builds a 7-day series', () => {
    const now = Date.parse('2026-08-21T12:00:00Z')
    const series = weekDailyWpm(
      [
        { at: now, mode: 'time', wpm: 40, accuracy: 90, errors: 1, durationMs: 1000, correct: 10, incorrect: 1 },
      ],
      now,
    )
    expect(series).toHaveLength(7)
    expect(series.at(-1)?.wpm).toBe(40)
  })
})

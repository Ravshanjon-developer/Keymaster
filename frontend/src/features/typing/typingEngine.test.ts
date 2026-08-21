import { describe, expect, it } from 'vitest'

import {
  calcAccuracy,
  calcAccuracyPrecise,
  calcWpm,
  consumeTypingKey,
  countCorrect,
  keyIdForChar,
  layoutRows,
  needsShift,
  nextDifficulty,
  recordKeyStroke,
  weakKeysFromStats,
} from './typingEngine'
import { generateTarget, generateWeakDrill } from './typingData'

describe('typing metrics', () => {
  it('computes WPM from correct characters', () => {
    expect(calcWpm(50, 60_000)).toBe(10)
    expect(calcWpm(10, 200)).toBe(0)
  })

  it('computes accuracy', () => {
    expect(calcAccuracy(9, 10)).toBe(90)
    expect(calcAccuracyPrecise(9, 10)).toBe(90)
    expect(calcAccuracy(0, 0)).toBe(100)
  })

  it('counts matching positions', () => {
    expect(countCorrect('abcx', 'abcd')).toBe(3)
  })
})

describe('layouts', () => {
  it('maps shifted and uppercase keys', () => {
    expect(keyIdForChar('{', 'en')).toBe('[')
    expect(needsShift('{', 'en')).toBe(true)
    expect(keyIdForChar('A', 'en')).toBe('a')
    expect(needsShift('A', 'en')).toBe(true)
    expect(needsShift('a', 'en')).toBe(false)
    expect(keyIdForChar(' ', 'ru')).toBe(' ')
  })

  it('puts Enter on the home row, not next to space', () => {
    const home = layoutRows('ru')[2]
    const bottom = layoutRows('ru')[4]
    expect(home.some((k) => k.id === 'Enter')).toBe(true)
    expect(bottom.some((k) => k.id === 'Enter')).toBe(false)
    expect(bottom.some((k) => k.id === ' ')).toBe(true)
  })
})

describe('key handling', () => {
  it('classifies pause, restart and characters', () => {
    expect(consumeTypingKey({ key: 'Escape' } as KeyboardEvent)).toEqual({ kind: 'pause' })
    expect(consumeTypingKey({ key: 'Enter', ctrlKey: true } as KeyboardEvent)).toEqual({ kind: 'restart' })
    expect(consumeTypingKey({ key: 'Backspace' } as KeyboardEvent)).toEqual({ kind: 'backspace' })
    expect(consumeTypingKey({ key: 'A' } as KeyboardEvent)).toEqual({ kind: 'char', char: 'A' })
  })
})

describe('weak keys and difficulty', () => {
  it('ranks inaccurate keys', () => {
    let stats = recordKeyStroke({}, 'p', 'o')
    stats = recordKeyStroke(stats, 'p', 'o')
    stats = recordKeyStroke(stats, 'p', 'p')
    stats = recordKeyStroke(stats, 'p', 'o')
    stats = recordKeyStroke(stats, 'a', 'a')
    stats = recordKeyStroke(stats, 'a', 'a')
    stats = recordKeyStroke(stats, 'a', 'a')
    stats = recordKeyStroke(stats, 'a', 'a')
    const weak = weakKeysFromStats(stats, 3, 5)
    expect(weak[0]?.key).toBe('p')
    expect(weak[0]?.accuracy).toBe(25)
  })

  it('raises difficulty only when both speed and accuracy are strong', () => {
    expect(nextDifficulty(2, 50, 98)).toBe(3)
    expect(nextDifficulty(3, 8, 70)).toBe(2)
    expect(nextDifficulty(2, 22, 90)).toBe(2)
  })
})

describe('generators', () => {
  it('builds non-empty targets for each mode', () => {
    expect(generateTarget({ mode: 'words', layout: 'ru', difficulty: 2 }).length).toBeGreaterThan(8)
    expect(generateTarget({ mode: 'code', layout: 'en', difficulty: 1, codeLang: 'python' }).length).toBeGreaterThan(8)
    expect(generateWeakDrill(['p', 'o'], 'en', 1).length).toBeGreaterThan(10)
  })
})

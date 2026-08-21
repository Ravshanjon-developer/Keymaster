import { describe, expect, it } from 'vitest'

import { deriveTrainerCopy, isChordEcho, saysTheSame } from './lessonCopy'

describe('saysTheSame', () => {
  it('treats word-form variants as duplicates', () => {
    expect(saysTheSame('Выделить всё', 'Выделите всё')).toBe(true)
    expect(saysTheSame('Сохранить', 'Сохранение')).toBe(true)
    expect(saysTheSame('Замена', 'Заменить текст')).toBe(true)
  })

  it('does not merge different actions', () => {
    expect(saysTheSame('Копировать', 'Вставить')).toBe(false)
    expect(saysTheSame('Сохранить', 'Сочетание')).toBe(false)
  })

  it('keeps genuinely different lines', () => {
    expect(saysTheSame('Поиск', 'Найдите текст без мыши')).toBe(false)
  })
})

describe('isChordEcho', () => {
  it('detects text that only repeats the chord', () => {
    expect(isChordEcho('Ctrl+H', ['Control', 'H'])).toBe(true)
    expect(isChordEcho('Нажмите Ctrl+H', ['Control', 'H'])).toBe(true)
    expect(isChordEcho('Замена текста', ['Control', 'H'])).toBe(false)
  })
})

describe('deriveTrainerCopy', () => {
  it('never repeats the same meaning twice and still explains on the back', () => {
    const copy = deriveTrainerCopy({
      keys: ['Control', 'A'],
      title: 'Выделить всё',
      action_prompt: 'Выделите всё',
      usage_example: 'Ctrl+A',
      description: 'Выделить всё',
    })
    expect(copy.headline).toBe('Выделить всё')
    expect(copy.why).toBe('')
    expect(copy.detail.toLowerCase()).toContain('выделяет')
  })

  it('keeps a distinct reason; long seed note wins over library', () => {
    const copy = deriveTrainerCopy({
      keys: ['Control', 'F'],
      title: 'Поиск',
      action_prompt: 'Откройте поиск',
      usage_example: 'Ctrl+F в редакторе кода — ищите слово по файлу целиком',
      description: 'Найти текст на странице',
    })
    expect(copy.headline).toBe('Поиск')
    expect(copy.why).toBe('Найти текст на странице')
    expect(copy.detail).toContain('редакторе кода')
  })

  it('explains cut in plain language for the card back', () => {
    const cut = deriveTrainerCopy({
      keys: ['Control', 'X'],
      title: 'Вырезать',
      action_prompt: 'Вырежьте',
      usage_example: 'Ctrl+X',
      description: 'Вырезание',
      locale: 'ru',
    })
    expect(cut.headline).toBe('Вырезать')
    expect(cut.detail.toLowerCase()).toMatch(/выреза|буфер|файл|папк/)
  })

  it('falls back to the prompt when there is no title', () => {
    const copy = deriveTrainerCopy({
      keys: ['End'],
      title: 'End',
      action_prompt: 'В конец строки',
    })
    expect(copy.headline).toBe('В конец строки')
    expect(copy.detail.toLowerCase()).toContain('конец')
  })

  it('localizes Tajik explanations', () => {
    const copy = deriveTrainerCopy({
      keys: ['Control', 'X'],
      title: 'Буридан',
      locale: 'tg',
    })
    expect(copy.detail.toLowerCase()).toMatch(/мебурад|буфер|папка/)
  })
})

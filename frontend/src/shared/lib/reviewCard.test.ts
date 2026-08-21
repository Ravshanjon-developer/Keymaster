import { describe, expect, it } from 'vitest'

import { reviewCardExplain, reviewCardMeaning } from '@/shared/lib/reviewCard'

describe('reviewCardMeaning', () => {
  it('prefers a real title over press-the-keys prompt', () => {
    expect(
      reviewCardMeaning({
        keys: ['Control', 'Shift', 'M'],
        title: 'Ctrl+Shift+M',
        action_prompt: 'Нажмите Ctrl+Shift+M',
        usage_example: 'Ctrl+Shift+M',
        description: '',
      }),
    ).toBe('')
  })

  it('shows the action name once', () => {
    expect(
      reviewCardMeaning({
        keys: ['Control', 'B'],
        title: 'Жирный',
        action_prompt: 'Сделайте текст жирным',
      }),
    ).toBe('Жирный')
  })

  it('falls back to description when title is a chord', () => {
    expect(
      reviewCardMeaning({
        keys: ['Control', 'S'],
        title: 'Ctrl+S',
        action_prompt: 'Нажмите Ctrl+S',
        description: 'Сохранение файла',
      }),
    ).toBe('Сохранение файла')
  })
})

describe('reviewCardExplain', () => {
  it('gives a plain explanation for cut', () => {
    const text = reviewCardExplain(
      {
        keys: ['Control', 'X'],
        title: 'Вырезать',
        description: 'Вырезание',
      },
      'ru',
    )
    expect(text.toLowerCase()).toMatch(/выреза|буфер/)
  })
})

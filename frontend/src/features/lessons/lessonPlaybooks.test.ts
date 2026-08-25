import { describe, expect, it } from 'vitest'

import { buildLessonCard } from './lessonPlaybooks'

describe('buildLessonCard', () => {
  it('uses the git status playbook', () => {
    const card = buildLessonCard({
      courseSlug: 'git',
      locale: 'ru',
      title: 'git status',
      keys: ['cmd:status'],
      summary: '',
      description: '',
      actionPrompt: '',
      usageExample: '',
    })
    expect(card.showSyntax).toBe(true)
    expect(card.features[0]?.title).toBe('Изменённые файлы')
    expect(card.whenToUse[0]).toMatch(/изменены/)
    expect(card.terminal.some((line) => line.text.includes('style.css'))).toBe(true)
  })

  it('hides fake syntax on concept lessons', () => {
    const card = buildLessonCard({
      courseSlug: 'git',
      locale: 'ru',
      title: 'Что такое Git',
      keys: ['cmd:intro'],
      summary: 'Git хранит историю.',
      description: 'Git хранит историю.',
      actionPrompt: 'Поймите Git',
      usageExample: 'Прочитайте',
    })
    expect(card.showSyntax).toBe(false)
    expect(card.showExample).toBe(false)
  })

  it('builds a structured computer-basics lesson', () => {
    const card = buildLessonCard({
      courseSlug: 'computer-basics',
      locale: 'ru',
      title: 'Файл и папка',
      seedTitle: 'Файл и папка',
      keys: [],
      summary: '',
      description: '',
      actionPrompt: '',
      usageExample: '',
    })
    expect(card.teach?.goals.length).toBeGreaterThan(2)
    expect(card.teach?.important).toBeTruthy()
    expect(card.teach?.example?.lines.some((line) => line.includes('notes.txt'))).toBe(true)
  })

  it('builds the files structure lesson with practice tree', () => {
    const card = buildLessonCard({
      courseSlug: 'computer-basics',
      locale: 'ru',
      title: 'Где хранить',
      seedTitle: 'Где хранить',
      keys: [],
      summary: '',
      description: '',
      actionPrompt: '',
      usageExample: '',
    })
    expect(card.teach?.practiceTree?.some((line) => line.includes('Documents'))).toBe(true)
    expect(card.teach?.howSteps.length).toBe(4)
    expect(card.teach?.practiceSteps).toHaveLength(4)
  })

  it('keeps Папка untranslated in Tajik copy', () => {
    const card = buildLessonCard({
      courseSlug: 'computer-basics',
      locale: 'tg',
      title: 'Файл ва папка',
      seedTitle: 'Файл и папка',
      keys: [],
      summary: '',
      description: '',
      actionPrompt: '',
      usageExample: '',
    })
    expect(card.summary).toContain('Папка')
    expect(card.teach?.goals.join(' ')).toContain('Папка')
  })

  it('builds a card for hotkey courses', () => {
    const card = buildLessonCard({
      courseSlug: 'windows',
      locale: 'ru',
      title: 'Копировать',
      keys: ['Control', 'C'],
      summary: 'Скопируйте выделенный текст в буфер обмена.',
      description: 'Скопируйте выделенный текст в буфер обмена. Вставка — отдельное сочетание.',
      actionPrompt: 'Скопируйте выделение',
      usageExample: 'Выделите текст; нажмите Ctrl+C',
    })
    expect(card.showSyntax).toBe(true)
    expect(card.features.length).toBeGreaterThan(0)
    expect(card.steps.length).toBeGreaterThan(0)
  })
})

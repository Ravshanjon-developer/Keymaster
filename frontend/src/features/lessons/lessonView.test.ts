import { describe, expect, it } from 'vitest'

import {
  classifyLesson,
  commandMatches,
  firstPlayableId,
  lessonSyntax,
  playableLessonId,
  sidebarMark,
  splitFacts,
  trackStatuses,
} from './lessonView'

describe('classifyLesson', () => {
  it('treats git command titles as command cards', () => {
    expect(classifyLesson('git', ['cmd:status'], 'git status')).toBe('command')
    expect(classifyLesson('git', ['cmd:version'], 'git --version')).toBe('command')
  })

  it('treats concept cards as concepts', () => {
    expect(classifyLesson('git', ['cmd:intro'], 'Что такое Git')).toBe('concept')
    expect(classifyLesson('github-desktop', ['cmd:pr'], 'Pull request')).toBe('concept')
  })

  it('treats chords as hotkeys', () => {
    expect(classifyLesson('windows', ['Control', 'C'], 'Копировать')).toBe('hotkey')
  })

  it('treats desktop tasks as desktop', () => {
    expect(classifyLesson('computer-basics', ['desktop:1'], 'Создайте папку')).toBe('desktop')
  })
})

describe('commandMatches', () => {
  it('ignores extra spaces and case', () => {
    expect(commandMatches('  GIT STATUS  ', 'git status')).toBe(true)
    expect(commandMatches('git add', 'git status')).toBe(false)
  })
})

describe('splitFacts', () => {
  it('splits sentences into short bullets', () => {
    expect(splitFacts('Git хранит историю проекта на компьютере. GitHub — отдельный сервис.')).toEqual([
      'Git хранит историю проекта на компьютере',
      'GitHub — отдельный сервис',
    ])
  })
})

describe('trackStatuses', () => {
  const ids = ['a', 'b', 'c']

  it('unlocks only the next lesson when sequential', () => {
    expect(trackStatuses(ids, new Set(['a']), 'b', true)).toEqual(['done', 'current', 'locked'])
  })

  it('keeps later lessons open when sequential is off', () => {
    expect(trackStatuses(ids, new Set(['a']), 'b', false)).toEqual(['done', 'current', 'available'])
  })
})

describe('sidebarMark', () => {
  it('labels the following lesson as next', () => {
    expect(sidebarMark('locked', 2, 1)).toBe('next')
    expect(sidebarMark('available', 2, 1)).toBe('next')
    expect(sidebarMark('done', 0, 1)).toBe('done')
  })
})

describe('firstPlayableId', () => {
  it('returns the current unlocked lesson', () => {
    expect(firstPlayableId(['a', 'b', 'c'], ['done', 'current', 'locked'])).toBe('b')
  })
})

describe('playableLessonId', () => {
  it('opens the first unfinished lesson', () => {
    expect(playableLessonId(['a', 'b', 'c'], new Set(['a']), true)).toBe('b')
  })
})

describe('lessonSyntax', () => {
  it('formats hotkeys and keeps command titles', () => {
    expect(lessonSyntax('hotkey', 'Копировать', ['Control', 'C'])).toBe('Ctrl + C')
    expect(lessonSyntax('command', 'git status', ['cmd:status'])).toBe('git status')
  })
})

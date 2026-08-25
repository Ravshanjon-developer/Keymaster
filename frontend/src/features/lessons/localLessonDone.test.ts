import { afterEach, describe, expect, it } from 'vitest'

import { addLocalLessonDone, clearLocalLessonDoneForTests, loadLocalLessonDone } from './localLessonDone'

describe('local lesson progress', () => {
  afterEach(() => {
    clearLocalLessonDoneForTests()
  })

  it('starts empty and remembers completed lesson ids per course', () => {
    expect(loadLocalLessonDone('programmer-basics')).toEqual([])
    expect(addLocalLessonDone('programmer-basics', ['a', 'b'])).toEqual(['a', 'b'])
    expect(addLocalLessonDone('programmer-basics', ['b', 'c'])).toEqual(['a', 'b', 'c'])
    expect(loadLocalLessonDone('programmer-basics')).toEqual(['a', 'b', 'c'])
    expect(loadLocalLessonDone('other')).toEqual([])
  })
})

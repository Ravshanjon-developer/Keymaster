import { describe, expect, it } from 'vitest'

import { getCourseStatus } from '@/shared/lib/courseStatus'
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

describe('growth unlock threshold', () => {
  it('uses 60% unlock gate', () => {
    expect(UNLOCK_PERCENT).toBe(60)
  })
})

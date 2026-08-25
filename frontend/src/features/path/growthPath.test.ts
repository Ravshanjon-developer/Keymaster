import { describe, expect, it } from 'vitest'

import {
  CORE_SEQUENCE,
  GROWTH_PATH,
  JOURNEY_SEQUENCE,
  coreNodes,
  journeyNodes,
  pickNextNode,
  resolvePathNodes,
} from '@/features/path/growthPath'
import { roadCurve, ROAD_VIEW_W, roadWaypoints, traveledRatio } from '@/features/path/pathRoad'
import type { CourseDto, CourseProgressDto } from '@/shared/lib/api'

const ALL_SLUGS = GROWTH_PATH.filter((n) => n.slug).map((n) => n.slug as string)

function course(slug: string): CourseDto {
  return {
    id: slug,
    slug,
    title: slug,
    description: '',
    icon: '',
    lesson_count: 10,
    category_count: 1,
  }
}

function progressOf(percents: Record<string, number>): CourseProgressDto[] {
  return Object.entries(percents).map(([slug, percent]) => ({
    course_id: slug,
    slug,
    title: slug,
    icon: '',
    lesson_count: 10,
    completed_lessons: Math.round(percent / 10),
    percent,
    xp_earned: 0,
    xp_total: 100,
  }))
}

function resolve(percents: Record<string, number> = {}, isGuest = false) {
  return resolvePathNodes({
    courses: ALL_SLUGS.map(course),
    progress: progressOf(percents),
    isGuest,
  })
}

const byId = (nodes: ReturnType<typeof resolve>, id: string) => nodes.find((n) => n.id === id)!

describe('resolvePathNodes', () => {
  it('opens only the first core stage for a brand new learner', () => {
    const nodes = resolve()
    expect(byId(nodes, 'computer').status).toBe('start')
    expect(byId(nodes, 'basics').status).toBe('locked')
    expect(byId(nodes, 'basics').blockedBy).toBe('computer')
  })

  it('keeps the next stage closed below the unlock threshold', () => {
    const nodes = resolve({ 'computer-basics': 59 })
    expect(byId(nodes, 'computer').status).toBe('progress')
    expect(byId(nodes, 'basics').unlocked).toBe(false)
  })

  it('opens the next stage once the previous one passes the threshold', () => {
    const nodes = resolve({ 'computer-basics': 60 })
    expect(byId(nodes, 'basics').unlocked).toBe(true)
    expect(byId(nodes, 'basics').status).toBe('start')
  })

  it('gates later stops on their required stage', () => {
    const locked = resolve({ 'computer-basics': 100 })
    expect(byId(locked, 'windows').unlocked).toBe(false)
    expect(byId(locked, 'chrome').blockedBy).toBe('github-desktop')
    expect(byId(locked, 'terminal').blockedBy).toBe('git')

    const open = resolve({ 'computer-basics': 100, 'programmer-basics': 60 })
    expect(byId(open, 'windows').unlocked).toBe(true)
    expect(byId(open, 'vscode').unlocked).toBe(false)
  })

  it('only opens the milestone when every core stage is finished', () => {
    const almost = resolve({
      'computer-basics': 100,
      'programmer-basics': 100,
      windows: 100,
      vscode: 100,
      git: 100,
    })
    expect(byId(almost, 'master').unlocked).toBe(false)
    expect(byId(almost, 'master').percent).toBe(71)

    const finished = resolve({
      'computer-basics': 100,
      'programmer-basics': 100,
      windows: 100,
      vscode: 100,
      git: 100,
      'github-desktop': 100,
      chrome: 100,
    })
    expect(byId(finished, 'master').status).toBe('done')
  })

  it('recommends only the first stage to guests', () => {
    const nodes = resolve({}, true)
    expect(byId(nodes, 'computer').unlocked).toBe(true)
    expect(nodes.filter((n) => n.unlocked)).toHaveLength(1)
  })

  it('skips stages whose course is missing from the API and never blocks on them', () => {
    const nodes = resolvePathNodes({
      courses: ALL_SLUGS.filter((s) => s !== 'programmer-basics').map(course),
      progress: progressOf({ 'computer-basics': 100 }),
      isGuest: false,
    })
    expect(byId(nodes, 'basics' as string)).toBeUndefined()
    expect(byId(nodes, 'windows').unlocked).toBe(true)
  })
})

describe('coreNodes', () => {
  it('returns the trunk in curriculum order', () => {
    expect(coreNodes(resolve()).map((n) => n.id)).toEqual([...CORE_SEQUENCE])
  })
})

describe('journeyNodes', () => {
  it('places later skills on the same road after their unlock stop', () => {
    const ids = journeyNodes(resolve()).map((n) => n.id)
    expect(ids).toEqual([...JOURNEY_SEQUENCE])
    expect(ids.indexOf('windows')).toBeLessThan(ids.indexOf('vscode'))
    expect(ids.indexOf('vscode')).toBeLessThan(ids.indexOf('git'))
    expect(ids.indexOf('git')).toBeLessThan(ids.indexOf('github-desktop'))
    expect(ids.indexOf('github-desktop')).toBeLessThan(ids.indexOf('chrome'))
  })
})

describe('pickNextNode', () => {
  it('points at the first unfinished stop on the road', () => {
    const nodes = resolve({ 'computer-basics': 100 })
    expect(pickNextNode(nodes)?.id).toBe('basics')
  })

  it('opens windows after the first two stops', () => {
    const nodes = resolve({
      'computer-basics': 100,
      'programmer-basics': 100,
    })
    expect(pickNextNode(nodes)?.id).toBe('windows')
  })

  it('stays on GitHub if Git is done and Chrome has leftover progress', () => {
    const nodes = resolve({
      'computer-basics': 100,
      'programmer-basics': 100,
      windows: 100,
      vscode: 100,
      git: 100,
      chrome: 20,
    })
    expect(pickNextNode(nodes)?.id).toBe('github-desktop')
  })

  it('walks past finished stops to the next open one', () => {
    const nodes = resolve({
      'computer-basics': 100,
      'programmer-basics': 100,
      windows: 100,
      vscode: 100,
    })
    expect(pickNextNode(nodes)?.id).toBe('git')
  })
})

describe('pathRoad', () => {
  it('builds a cubic S-curve through alternating waypoints', () => {
    const points = roadWaypoints(3)
    expect(points[0].x).toBeLessThan(points[1].x)
    expect(points[1].x).toBeGreaterThan(points[2].x)
    expect(points[1].x - points[0].x).toBeGreaterThan(ROAD_VIEW_W * 0.6)
    expect(roadCurve(points)).toContain('C')
  })

  it('fills the road once every stop is behind the current one', () => {
    expect(traveledRatio(0, 5)).toBe(0)
    expect(traveledRatio(-1, 5)).toBe(1)
  })
})

/** One journey: the main road is short; extra courses stay in the catalog. */

import type { CourseDto, CourseProgressDto } from '@/shared/lib/api'

export type PathTrack = 'core' | 'dev' | 'web' | 'office' | 'os' | 'design'
export type PathNodeKind = 'course' | 'milestone'
export type NodeStatus = 'locked' | 'start' | 'progress' | 'done'

export type GrowthNodeDef = {
  id: string
  kind: PathNodeKind
  slug?: string
  track: PathTrack
  requires: string[]
}

export const UNLOCK_PERCENT = 60
export const CORE_SEQUENCE = [
  'computer',
  'basics',
  'windows',
  'vscode',
  'git',
  'github-desktop',
  'chrome',
] as const

/** Visual order on the road. Unlock rules still follow `requires`. */
export const JOURNEY_SEQUENCE = [...CORE_SEQUENCE, 'master'] as const

export const GROWTH_PATH: GrowthNodeDef[] = [
  { id: 'computer', kind: 'course', slug: 'computer-basics', track: 'core', requires: [] },
  { id: 'basics', kind: 'course', slug: 'programmer-basics', track: 'core', requires: ['computer'] },
  { id: 'windows', kind: 'course', slug: 'windows', track: 'core', requires: ['basics'] },
  { id: 'vscode', kind: 'course', slug: 'vscode', track: 'core', requires: ['windows'] },
  { id: 'git', kind: 'course', slug: 'git', track: 'core', requires: ['vscode'] },
  { id: 'github-desktop', kind: 'course', slug: 'github-desktop', track: 'core', requires: ['git'] },
  { id: 'chrome', kind: 'course', slug: 'chrome', track: 'core', requires: ['github-desktop'] },

  { id: 'terminal', kind: 'course', slug: 'terminal', track: 'dev', requires: ['git'] },
  { id: 'cursor', kind: 'course', slug: 'cursor', track: 'dev', requires: ['git'] },
  { id: 'visual-studio', kind: 'course', slug: 'visual-studio', track: 'dev', requires: ['git'] },
  { id: 'intellij', kind: 'course', slug: 'intellij', track: 'dev', requires: ['git'] },
  { id: 'pycharm', kind: 'course', slug: 'pycharm', track: 'dev', requires: ['git'] },

  { id: 'edge', kind: 'course', slug: 'edge', track: 'web', requires: ['chrome'] },

  { id: 'word', kind: 'course', slug: 'word', track: 'office', requires: ['windows'] },
  { id: 'excel', kind: 'course', slug: 'excel', track: 'office', requires: ['windows'] },
  { id: 'powerpoint', kind: 'course', slug: 'powerpoint', track: 'office', requires: ['windows'] },

  { id: 'macos', kind: 'course', slug: 'macos', track: 'os', requires: ['windows'] },
  { id: 'linux', kind: 'course', slug: 'linux', track: 'os', requires: ['windows'] },

  { id: 'figma', kind: 'course', slug: 'figma', track: 'design', requires: ['windows'] },
  { id: 'photoshop', kind: 'course', slug: 'photoshop', track: 'design', requires: ['windows'] },

  { id: 'master', kind: 'milestone', track: 'core', requires: [...CORE_SEQUENCE] },
]

export type ResolvedNode = GrowthNodeDef & {
  course?: CourseDto
  progress?: CourseProgressDto
  percent: number
  status: NodeStatus
  unlocked: boolean
  blockedBy?: string
}

export type PathInput = {
  courses: CourseDto[]
  progress: CourseProgressDto[]
  isGuest: boolean
}

export function resolvePathNodes({ courses, progress, isGuest }: PathInput): ResolvedNode[] {
  const bySlug = new Map(courses.map((c) => [c.slug, c]))
  const progressBySlug = new Map(progress.map((p) => [p.slug, p]))

  const available = GROWTH_PATH.filter(
    (def) => def.kind !== 'course' || (def.slug && bySlug.has(def.slug)),
  )

  const percentOf = (def: GrowthNodeDef) =>
    def.kind === 'course' && def.slug ? (progressBySlug.get(def.slug)?.percent ?? 0) : 0

  const percentById = new Map(available.map((def) => [def.id, percentOf(def)]))

  const cleared = (id: string) => {
    const percent = percentById.get(id)
    return percent === undefined ? true : percent >= UNLOCK_PERCENT
  }

  const coreDefs = available.filter((d) => d.track === 'core' && d.kind === 'course')
  const coreDone = coreDefs.filter((d) => percentOf(d) >= 100).length
  const firstCoreId = CORE_SEQUENCE.find((id) => available.some((d) => d.id === id))

  return available.map((def) => {
    const course = def.slug ? bySlug.get(def.slug) : undefined
    const nodeProgress = def.slug ? progressBySlug.get(def.slug) : undefined
    let percent = percentOf(def)

    let unlocked = def.requires.every(cleared)
    if (def.kind === 'milestone') {
      unlocked = coreDefs.length > 0 && coreDone >= coreDefs.length
      percent = coreDefs.length ? Math.round((coreDone / coreDefs.length) * 100) : 0
    }

    if (isGuest) unlocked = def.id === firstCoreId

    let status: NodeStatus = 'locked'
    if (!unlocked) status = 'locked'
    else if (percent >= 100) status = 'done'
    else if (percent > 0) status = 'progress'
    else status = 'start'

    const blockedBy = unlocked ? undefined : def.requires.find((id) => !cleared(id))

    return { ...def, course, progress: nodeProgress, percent, status, unlocked, blockedBy }
  })
}

export function coreNodes(nodes: ResolvedNode[]): ResolvedNode[] {
  return CORE_SEQUENCE.map((id) => nodes.find((n) => n.id === id)).filter(
    (n): n is ResolvedNode => !!n,
  )
}

export function journeyNodes(nodes: ResolvedNode[]): ResolvedNode[] {
  return JOURNEY_SEQUENCE.map((id) => nodes.find((n) => n.id === id)).filter(
    (n): n is ResolvedNode => !!n,
  )
}

export function pickNextNode(nodes: ResolvedNode[]): ResolvedNode | undefined {
  return journeyNodes(nodes).find((n) => n.unlocked && n.status !== 'done')
}

export type CareerRankKey =
  | 'path.rankMaster'
  | 'path.rankSenior'
  | 'path.rankMid'
  | 'path.rankJunior'
  | 'path.rankTrainee'
  | 'path.rankNovice'

export function careerRankKey(completedCourses: number, xp: number): CareerRankKey {
  if (completedCourses >= 12 || xp >= 5500) return 'path.rankMaster'
  if (completedCourses >= 8 || xp >= 3000) return 'path.rankSenior'
  if (completedCourses >= 5 || xp >= 1500) return 'path.rankMid'
  if (completedCourses >= 2 || xp >= 600) return 'path.rankJunior'
  if (completedCourses >= 1 || xp >= 100) return 'path.rankTrainee'
  return 'path.rankNovice'
}

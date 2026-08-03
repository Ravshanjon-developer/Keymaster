/** Visual career path — maps to EXISTING course slugs only. Does not rename or alter courses. */

import { getT } from '@/shared/i18n'

export type NodeShape = 'rect' | 'hex' | 'diamond' | 'wide'
export type NodeLane = 'center' | 'left' | 'right'
export type PathNodeKind = 'start' | 'course' | 'milestone'

export type GrowthNodeDef = {
  id: string
  kind: PathNodeKind
  /** Existing course slug from API — never invent new courses */
  slug?: string
  /** Career label on the map (UI only; course title stays original) */
  careerTitle: string
  difficulty: 1 | 2 | 3 | 4 | 5
  shape: NodeShape
  lane: NodeLane
  /** Node ids that must be unlocked (≥ unlock threshold) before this opens */
  requires: string[]
}

export const UNLOCK_PERCENT = 60

/**
 * Developer Growth Path spine + tool branches.
 * Any slug missing from API is simply skipped at render time.
 */
export const GROWTH_PATH: GrowthNodeDef[] = [
  {
    id: 'start',
    kind: 'start',
    careerTitle: 'START',
    difficulty: 1,
    shape: 'diamond',
    lane: 'center',
    requires: [],
  },
  {
    id: 'basics',
    kind: 'course',
    slug: 'programmer-basics',
    careerTitle: 'Keyboard Foundation',
    difficulty: 1,
    shape: 'wide',
    lane: 'center',
    requires: ['start'],
  },
  {
    id: 'windows',
    kind: 'course',
    slug: 'windows',
    careerTitle: 'Fast Editing',
    difficulty: 2,
    shape: 'rect',
    lane: 'center',
    requires: ['basics'],
  },
  {
    id: 'vscode',
    kind: 'course',
    slug: 'vscode',
    careerTitle: 'VS Code Developer',
    difficulty: 3,
    shape: 'hex',
    lane: 'center',
    requires: ['windows'],
  },
  {
    id: 'git',
    kind: 'course',
    slug: 'git',
    careerTitle: 'Git Workflow',
    difficulty: 3,
    shape: 'diamond',
    lane: 'center',
    requires: ['vscode'],
  },
  {
    id: 'cursor',
    kind: 'course',
    slug: 'cursor',
    careerTitle: 'AI Pair Programming',
    difficulty: 3,
    shape: 'rect',
    lane: 'left',
    requires: ['git'],
  },
  {
    id: 'terminal',
    kind: 'course',
    slug: 'terminal',
    careerTitle: 'Terminal Fluent',
    difficulty: 3,
    shape: 'hex',
    lane: 'center',
    requires: ['git'],
  },
  {
    id: 'chrome',
    kind: 'course',
    slug: 'chrome',
    careerTitle: 'Browser Velocity',
    difficulty: 2,
    shape: 'rect',
    lane: 'right',
    requires: ['git'],
  },
  {
    id: 'edge',
    kind: 'course',
    slug: 'edge',
    careerTitle: 'Edge Power User',
    difficulty: 2,
    shape: 'rect',
    lane: 'right',
    requires: ['chrome'],
  },
  {
    id: 'visual-studio',
    kind: 'course',
    slug: 'visual-studio',
    careerTitle: 'Visual Studio Pro',
    difficulty: 4,
    shape: 'wide',
    lane: 'center',
    requires: ['terminal', 'cursor'],
  },
  {
    id: 'intellij',
    kind: 'course',
    slug: 'intellij',
    careerTitle: 'JVM Craft',
    difficulty: 4,
    shape: 'hex',
    lane: 'left',
    requires: ['visual-studio'],
  },
  {
    id: 'pycharm',
    kind: 'course',
    slug: 'pycharm',
    careerTitle: 'Python Craft',
    difficulty: 4,
    shape: 'hex',
    lane: 'right',
    requires: ['visual-studio'],
  },
  {
    id: 'macos',
    kind: 'course',
    slug: 'macos',
    careerTitle: 'macOS Fluency',
    difficulty: 3,
    shape: 'rect',
    lane: 'left',
    requires: ['basics'],
  },
  {
    id: 'linux',
    kind: 'course',
    slug: 'linux',
    careerTitle: 'Linux Fluency',
    difficulty: 3,
    shape: 'rect',
    lane: 'right',
    requires: ['basics'],
  },
  {
    id: 'github-desktop',
    kind: 'course',
    slug: 'github-desktop',
    careerTitle: 'Ship with GitHub',
    difficulty: 3,
    shape: 'diamond',
    lane: 'center',
    requires: ['git'],
  },
  {
    id: 'word',
    kind: 'course',
    slug: 'word',
    careerTitle: 'Docs at Speed',
    difficulty: 2,
    shape: 'rect',
    lane: 'left',
    requires: ['windows'],
  },
  {
    id: 'excel',
    kind: 'course',
    slug: 'excel',
    careerTitle: 'Sheets at Speed',
    difficulty: 2,
    shape: 'rect',
    lane: 'right',
    requires: ['windows'],
  },
  {
    id: 'powerpoint',
    kind: 'course',
    slug: 'powerpoint',
    careerTitle: 'Slides at Speed',
    difficulty: 2,
    shape: 'rect',
    lane: 'center',
    requires: ['word', 'excel'],
  },
  {
    id: 'photoshop',
    kind: 'course',
    slug: 'photoshop',
    careerTitle: 'Pixel Shortcuts',
    difficulty: 4,
    shape: 'hex',
    lane: 'left',
    requires: ['powerpoint'],
  },
  {
    id: 'figma',
    kind: 'course',
    slug: 'figma',
    careerTitle: 'Design Velocity',
    difficulty: 4,
    shape: 'hex',
    lane: 'right',
    requires: ['powerpoint'],
  },
  {
    id: 'master',
    kind: 'milestone',
    careerTitle: 'Keyboard Master',
    difficulty: 5,
    shape: 'wide',
    lane: 'center',
    requires: ['intellij', 'pycharm', 'edge', 'figma'],
  },
]

export type NodeStatus = 'locked' | 'start' | 'progress' | 'done'

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

export function careerRankTitle(completedCourses: number, xp: number): string {
  return getT()(careerRankKey(completedCourses, xp))
}

export type DifficultyKey =
  | 'path.diffNovice'
  | 'path.diffCore'
  | 'path.diffPro'
  | 'path.diffAdvanced'
  | 'path.diffElite'

export function difficultyKey(d: number): DifficultyKey {
  const keys: DifficultyKey[] = [
    'path.diffNovice',
    'path.diffNovice',
    'path.diffCore',
    'path.diffPro',
    'path.diffAdvanced',
    'path.diffElite',
  ]
  return keys[d] ?? 'path.diffCore'
}

export function difficultyLabel(d: number): string {
  return getT()(difficultyKey(d))
}

import { formatShortcut } from '@/shared/lib/hotkeys'
import { isTaskLesson } from '@/shared/lib/lessonKind'
import { parseDesktopTaskId } from '@/shared/lib/simulatorProgress'
import { parseTaskSteps } from '@/shared/lib/taskSteps'

export type LessonKind = 'command' | 'concept' | 'hotkey' | 'desktop'
export type TrackStatus = 'done' | 'current' | 'locked' | 'available'

export type TerminalLine = {
  text: string
  tone?: 'muted' | 'ok' | 'warn' | 'err' | 'cmd'
}

function titleLooksLikeCommand(title: string): boolean {
  const value = title.trim()
  return /^(git|npm|cd)\b/i.test(value)
}

export function classifyLesson(
  courseSlug: string | undefined,
  keys: string[] | undefined,
  title: string,
): LessonKind {
  if (parseDesktopTaskId(keys) !== null) return 'desktop'
  if (titleLooksLikeCommand(title)) return 'command'
  const raw = keys?.[0]
  if (typeof raw === 'string' && raw.startsWith('cmd:')) return 'concept'
  if (isTaskLesson(courseSlug, keys)) return 'concept'
  return 'hotkey'
}

export function lessonSyntax(kind: LessonKind, title: string, keys: string[]): string {
  if (kind === 'hotkey') return formatShortcut(keys)
  return title.trim()
}

export function expectedCommand(kind: LessonKind, title: string): string | null {
  if (kind !== 'command') return null
  return title.trim()
}

export function normalizeCommand(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function commandMatches(input: string, expected: string): boolean {
  const got = normalizeCommand(input)
  const need = normalizeCommand(expected)
  if (!got || !need) return false
  return got === need
}

export function splitFacts(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim().replace(/[.]$/, ''))
    .filter((part) => part.length > 12)
    .slice(0, 4)
}

const GIT_OUTPUT: Record<string, TerminalLine[]> = {
  version: [{ text: 'git version 2.45.1', tone: 'ok' }],
  status: [
    { text: 'On branch main', tone: 'ok' },
    { text: 'Untracked files:', tone: 'muted' },
    { text: '  (use "git add <file>..." to include in what will be committed)', tone: 'muted' },
    { text: '\tindex.html', tone: 'warn' },
  ],
  log: [
    { text: 'a81f2c1 Add login page', tone: 'ok' },
    { text: '91ab321 Fix navbar', tone: 'muted' },
    { text: '32cc871 Initial commit', tone: 'muted' },
  ],
  branch: [
    { text: '* main', tone: 'ok' },
    { text: '  feature-login', tone: 'muted' },
  ],
  remote: [
    { text: 'origin  https://github.com/user/project.git (fetch)', tone: 'ok' },
    { text: 'origin  https://github.com/user/project.git (push)', tone: 'muted' },
  ],
  diff: [
    { text: 'diff --git a/index.html b/index.html', tone: 'muted' },
    { text: '- <h1>Home</h1>', tone: 'err' },
    { text: '+ <h1>Welcome</h1>', tone: 'ok' },
  ],
}

export function terminalExample(kind: LessonKind, title: string, keys: string[], hint: string): TerminalLine[] {
  const slug = keys[0]?.startsWith('cmd:') ? keys[0].slice(4) : ''
  const prompt = kind === 'hotkey' ? formatShortcut(keys) : title.trim()
  const lines: TerminalLine[] = [{ text: `$ ${prompt}`, tone: 'cmd' }]
  const preset = slug ? GIT_OUTPUT[slug] : undefined
  if (preset) return [...lines, ...preset]
  const note = hint.split(/[.;]/)[0]?.trim()
  if (note) lines.push({ text: note, tone: 'muted' })
  return lines
}

export function practiceSteps(usageExample: string, fallback: string): string[] {
  const steps = parseTaskSteps(usageExample)
  if (steps.length) return steps
  return fallback ? [fallback] : []
}

export function trackStatuses(
  orderedIds: string[],
  completed: Set<string>,
  currentId: string,
  sequential: boolean,
): TrackStatus[] {
  let maxDone = -1
  orderedIds.forEach((id, index) => {
    if (completed.has(id)) maxDone = Math.max(maxDone, index)
  })

  return orderedIds.map((id, index) => {
    if (completed.has(id)) return 'done'
    const unlocked = !sequential || index === 0 || index <= maxDone + 1
    if (!unlocked) return 'locked'
    if (id === currentId) return 'current'
    return 'available'
  })
}

export type SidebarMark = 'done' | 'current' | 'next' | 'locked' | 'available'

export function sidebarMark(status: TrackStatus, index: number, currentIndex: number): SidebarMark {
  if (status === 'done') return 'done'
  if (status === 'current') return 'current'
  if (index === currentIndex + 1) return 'next'
  if (status === 'locked') return 'locked'
  return 'available'
}

export function playableLessonId(
  orderedIds: string[],
  completed: Set<string>,
  sequential: boolean,
): string | null {
  if (!orderedIds.length) return null
  const currentId = orderedIds.find((id) => !completed.has(id)) ?? orderedIds[0]!
  const statuses = trackStatuses(orderedIds, completed, currentId, sequential)
  return firstPlayableId(orderedIds, statuses)
}

export function firstPlayableId(orderedIds: string[], statuses: TrackStatus[]): string | null {
  const currentIndex = statuses.findIndex((status) => status === 'current')
  if (currentIndex >= 0) return orderedIds[currentIndex] ?? null
  const available = statuses.findIndex((status) => status === 'available')
  if (available >= 0) return orderedIds[available] ?? null
  const doneLast = [...statuses].lastIndexOf('done')
  if (doneLast >= 0) return orderedIds[Math.min(doneLast + 1, orderedIds.length - 1)] ?? null
  return orderedIds[0] ?? null
}

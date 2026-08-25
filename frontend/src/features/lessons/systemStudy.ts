import { chordKey, formatShortcut, normalizeShortcutKeys } from '@/shared/lib/hotkeys'

export type SystemExplainId =
  | 'systemExplainAltTab'
  | 'systemExplainAltF4'
  | 'systemExplainWinD'
  | 'systemExplainWinE'
  | 'systemExplainPrtSc'
  | 'systemExplainWinShiftS'

const EXPLAIN_BY_CHORD: Record<string, SystemExplainId> = {
  'Alt|Tab': 'systemExplainAltTab',
  'Alt|F4': 'systemExplainAltF4',
  'D|Meta': 'systemExplainWinD',
  'E|Meta': 'systemExplainWinE',
  PrintScreen: 'systemExplainPrtSc',
  'Meta|S|Shift': 'systemExplainWinShiftS',
}

export function isProgrammerSystemCategory(
  courseSlug: string | null | undefined,
  categorySlug: string | null | undefined,
): boolean {
  return courseSlug === 'programmer-basics' && categorySlug === 'system'
}

export function systemExplainId(keys: string[]): SystemExplainId | null {
  return EXPLAIN_BY_CHORD[chordKey(normalizeShortcutKeys(keys))] ?? null
}

export type SystemStudyRow = {
  id: string
  keys: string[]
  title: string
  shortcut: string
  meaning: string
  done: boolean
}

export function systemShortcutLabel(keys: string[]): string {
  return formatShortcut(keys)
}

const TICKS_STORAGE_KEY = 'km_system_study_ticks_v1'

export function loadSystemStudyTicks(): Record<string, boolean> {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(TICKS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: Record<string, boolean> = {}
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value === true) out[id] = true
    }
    return out
  } catch {
    return {}
  }
}

export function saveSystemStudyTicks(ticks: Record<string, boolean>): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(TICKS_STORAGE_KEY, JSON.stringify(ticks))
  } catch {
    // ignore quota / private mode
  }
}

/** Keep user ticks when changing lessons; only force-on items already completed. */
export function mergeSystemStudyTicks(
  ids: string[],
  stored: Record<string, boolean>,
  completed: Record<string, boolean>,
): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const id of ids) {
    next[id] = Boolean(stored[id] || completed[id])
  }
  return next
}

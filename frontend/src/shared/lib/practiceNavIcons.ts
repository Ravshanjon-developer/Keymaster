import type { LucideIcon } from 'lucide-react'
import {
  Command,
  Gauge,
  GraduationCap,
  Keyboard,
  Layers,
  LayoutDashboard,
  ListChecks,
  Monitor,
  SquareCode,
  Target,
} from 'lucide-react'

/**
 * Single source of truth for practice-mode icons.
 * Prefer semantic Lucide glyphs over decorative Zap/Sparkles/Brain.
 */
export const practiceIcons = {
  hub: LayoutDashboard,
  typing: Keyboard,
  desktop: Monitor,
  simulator: SquareCode,
  hotkeys: Command,
  speed: Gauge,
  review: Layers,
  quiz: ListChecks,
  exam: GraduationCap,
  /** Mobile tab / global “practice” entry */
  practice: Target,
} as const satisfies Record<string, LucideIcon>

/** Thin, optically even strokes at 16–20px (product UI, not marketing). */
export const PRACTICE_ICON_STROKE = 1.75

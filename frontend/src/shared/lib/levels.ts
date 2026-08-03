import { getT, levelTitleKey } from '@/shared/i18n'

const THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500]
const MAX_LEVEL = 11

export function levelFromXp(xp: number): { level: number; title: string; progress: number } {
  let level = 1
  for (let i = 0; i < THRESHOLDS.length; i++) {
    if (xp >= THRESHOLDS[i]) level = i + 1
  }
  level = Math.min(level, MAX_LEVEL)
  const current = THRESHOLDS[level - 1] ?? 0
  const next = THRESHOLDS[level] ?? THRESHOLDS[THRESHOLDS.length - 1]
  const progress = next === current ? 100 : ((xp - current) / (next - current)) * 100
  return {
    level,
    title: getT()(levelTitleKey(level)),
    progress: Math.min(100, Math.max(0, progress)),
  }
}

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useAuthStore } from '@/features/auth/authStore'
import {
  GROWTH_PATH,
  UNLOCK_PERCENT,
  careerRankKey,
  type GrowthNodeDef,
  type NodeStatus,
} from '@/features/path/growthPath'
import { useT } from '@/shared/i18n'
import { api, type CourseDto, type CourseProgressDto } from '@/shared/lib/api'

export type ResolvedNode = GrowthNodeDef & {
  course?: CourseDto
  progress?: CourseProgressDto
  percent: number
  status: NodeStatus
  unlocked: boolean
  unlockHint?: string
}

export function useGrowthPath() {
  const user = useAuthStore((s) => s.user)
  const t = useT()
  const courses = useQuery({ queryKey: ['courses'], queryFn: api.courses })
  const progress = useQuery({
    queryKey: ['course-progress'],
    queryFn: api.courseProgress,
    enabled: !!user,
  })

  const bySlug = useMemo(() => {
    const map = new Map<string, CourseDto>()
    courses.data?.forEach((c) => map.set(c.slug, c))
    return map
  }, [courses.data])

  const progressBySlug = useMemo(() => {
    const map = new Map<string, CourseProgressDto>()
    progress.data?.forEach((p) => map.set(p.slug, p))
    return map
  }, [progress.data])

  const nodes: ResolvedNode[] = useMemo(() => {
    const available = GROWTH_PATH.filter(
      (def) => def.kind !== 'course' || (def.slug && bySlug.has(def.slug)),
    )

    const percentOf = (def: GrowthNodeDef) => {
      if (def.kind === 'start') return 100
      if (def.kind === 'course' && def.slug) return progressBySlug.get(def.slug)?.percent ?? 0
      return 0
    }

    const byId = new Map<string, { def: GrowthNodeDef; percent: number }>()
    for (const def of available) {
      byId.set(def.id, { def, percent: percentOf(def) })
    }

    const meets = (id: string) => {
      const n = byId.get(id)
      if (!n) return true
      if (n.def.kind === 'start') return true
      return n.percent >= UNLOCK_PERCENT
    }

    const courseDefs = available.filter((d) => d.kind === 'course')
    const doneCount = courseDefs.filter((d) => percentOf(d) >= 100).length

    return available.map((def) => {
      const course = def.slug ? bySlug.get(def.slug) : undefined
      const prog = def.slug ? progressBySlug.get(def.slug) : undefined
      let percent = percentOf(def)

      let unlocked = def.requires.every(meets)
      if (def.kind === 'start') unlocked = true
      if (def.kind === 'milestone') {
        unlocked = doneCount >= Math.min(8, Math.max(1, courseDefs.length))
        percent = courseDefs.length ? Math.round((doneCount / courseDefs.length) * 100) : 0
      }

      // Guests: only foundation open; rest locked (map still visible)
      if (!user && def.kind !== 'start') {
        unlocked = def.id === 'basics'
      }

      let status: NodeStatus = 'locked'
      if (def.kind === 'start') status = 'done'
      else if (!unlocked) status = 'locked'
      else if (percent >= 100 || (def.kind === 'milestone' && percent >= 90)) status = 'done'
      else if (percent > 0) status = 'progress'
      else status = 'start'

      let unlockHint: string | undefined
      if (!unlocked && def.requires.length) {
        const blocking = def.requires
          .map((id) => byId.get(id)?.def)
          .find((d) => d && !meets(d.id))
        if (blocking) {
          unlockHint = t('path.unlockAfter', {
            percent: UNLOCK_PERCENT,
            stage: blocking.careerTitle,
          })
        }
      }

      return {
        ...def,
        course,
        progress: prog,
        percent,
        status,
        unlocked,
        unlockHint,
      }
    })
  }, [bySlug, progressBySlug, user, t])

  const courseNodes = nodes.filter((n) => n.kind === 'course')
  const completedCourses = courseNodes.filter((n) => n.percent >= 100).length
  const next = nodes.find((n) => n.kind === 'course' && n.unlocked && n.status !== 'done')
  const rank = t(careerRankKey(completedCourses, user?.xp ?? 0))

  return {
    nodes,
    coursesLoading: courses.isLoading,
    progressLoading: !!user && progress.isLoading,
    completedCourses,
    totalCourses: courseNodes.length,
    next,
    rank,
    user,
    xp: user?.xp ?? 0,
  }
}

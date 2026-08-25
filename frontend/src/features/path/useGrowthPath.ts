import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useAuthStore } from '@/features/auth/authStore'
import { syncLocalProgressToServer } from '@/features/lessons/syncLocalProgress'
import { careerRankKey, journeyNodes, pickNextNode, resolvePathNodes } from '@/features/path/growthPath'
import { useT } from '@/shared/i18n'
import { api } from '@/shared/lib/api'

export type { ResolvedNode } from '@/features/path/growthPath'

const NO_COURSES: never[] = []

export function useGrowthPath() {
  const user = useAuthStore((s) => s.user)
  const t = useT()
  const courses = useQuery({ queryKey: ['courses'], queryFn: api.courses })
  const progress = useQuery({
    queryKey: ['course-progress'],
    queryFn: async () => {
      await syncLocalProgressToServer()
      return api.courseProgress()
    },
    enabled: !!user,
  })

  const nodes = useMemo(
    () =>
      resolvePathNodes({
        courses: courses.data ?? NO_COURSES,
        progress: progress.data ?? NO_COURSES,
        isGuest: !user,
      }),
    [courses.data, progress.data, user],
  )

  const journey = useMemo(() => journeyNodes(nodes), [nodes])
  const next = useMemo(() => pickNextNode(nodes), [nodes])

  const milestone = nodes.find((n) => n.kind === 'milestone')
  const courseNodes = nodes.filter((n) => n.kind === 'course')
  const completedCourses = courseNodes.filter((n) => n.percent >= 100).length
  const rank = t(careerRankKey(completedCourses, user?.xp ?? 0))

  return {
    nodes,
    journey,
    milestone,
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

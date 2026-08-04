export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'start'

export function getCourseStatus(opts: {
  percent: number | null | undefined
  isStartCourse?: boolean
}): CourseStatus {
  const percent = opts.percent ?? 0
  if (percent >= 100) return 'completed'
  if (percent > 0) return 'in_progress'
  if (opts.isStartCourse) return 'start'
  return 'not_started'
}

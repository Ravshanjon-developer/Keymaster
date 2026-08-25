import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2, Library, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { CourseBrandIcon } from '@/features/courses/CourseBrandIcon'
import { playableLessonId } from '@/features/lessons/lessonView'
import { useAuthStore } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { getCourseStatus } from '@/shared/lib/courseStatus'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { LearnProgressBar } from '@/shared/components/LearnStatus'
import { PageHeader, PageShell, SkeletonCardGrid } from '@/shared/components/PageLayout'
import { EmptyState, GlassCard, Skeleton, StatusBadge } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

type CourseGroup = 'all' | 'start' | 'os' | 'editors' | 'browsers' | 'office' | 'vcs'

const COURSE_GROUPS: Record<Exclude<CourseGroup, 'all'>, string[]> = {
  start: ['computer-basics', 'programmer-basics'],
  os: ['windows', 'linux', 'macos', 'terminal'],
  editors: ['vscode', 'cursor', 'visual-studio', 'intellij', 'pycharm'],
  browsers: ['chrome', 'edge'],
  office: ['word', 'excel', 'powerpoint', 'photoshop', 'figma'],
  vcs: ['git', 'github-desktop'],
}

const FILTERS: { id: CourseGroup; label: 'courses.filterAll' | 'courses.filterStart' | 'courses.filterOs' | 'courses.filterEditors' | 'courses.filterBrowsers' | 'courses.filterOffice' | 'courses.filterVcs' }[] = [
  { id: 'all', label: 'courses.filterAll' },
  { id: 'start', label: 'courses.filterStart' },
  { id: 'os', label: 'courses.filterOs' },
  { id: 'editors', label: 'courses.filterEditors' },
  { id: 'browsers', label: 'courses.filterBrowsers' },
  { id: 'office', label: 'courses.filterOffice' },
  { id: 'vcs', label: 'courses.filterVcs' },
]

function countWord(n: number, one: string, few: string, many: string) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return one
  if (n10 >= 2 && n10 <= 4 && n100 !== 12 && n100 !== 13 && n100 !== 14) return few
  return many
}

function matchesGroup(slug: string, group: CourseGroup) {
  if (group === 'all') return true
  return COURSE_GROUPS[group].includes(slug)
}

export function CoursesPage() {
  const t = useT()
  const { localizeCourse } = useLocalizedContent()
  const user = useAuthStore((s) => s.user)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<CourseGroup>('all')
  const { data, isLoading, isError } = useQuery({ queryKey: ['courses'], queryFn: api.courses })
  const courseProgress = useQuery({
    queryKey: ['course-progress'],
    queryFn: api.courseProgress,
    enabled: !!user,
  })

  const progressBySlug = useMemo(() => {
    const map = new Map<string, { percent: number; completed: number; total: number }>()
    courseProgress.data?.forEach((p) =>
      map.set(p.slug, {
        percent: p.percent,
        completed: p.completed_lessons,
        total: p.lesson_count,
      }),
    )
    return map
  }, [courseProgress.data])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (data ?? []).filter((course) => {
      if (!matchesGroup(course.slug, group)) return false
      if (!needle) return true
      const loc = localizeCourse(course.slug, course.title, course.description)
      return `${loc.title} ${loc.description} ${course.slug}`.toLowerCase().includes(needle)
    })
  }, [data, group, query, localizeCourse])

  return (
    <PageShell>
      <PageHeader
        title={t('courses.title')}
        subtitle={t('courses.subtitle')}
        actions={
          <Link to="/path" className="btn-secondary shrink-0">
            {t('nav.path')}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      {isLoading && <SkeletonCardGrid count={9} />}

      {isError && (
        <EmptyState
          title={t('courses.apiDownTitle')}
          description={t('courses.apiDownDesc')}
        />
      )}

      {!isLoading && !isError && (
      <>
      <div className="mb-5 space-y-3">
        <label className="block">
          <span className="sr-only">{t('courses.searchLabel')}</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('courses.searchPlaceholder')}
              className="input-field mt-0 pl-10"
            />
          </span>
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('courses.searchLabel')}>
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setGroup(item.id)}
              className={cn(
                'min-h-11 rounded-full px-3.5 text-[13px] font-semibold transition',
                group === item.id
                  ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-ink'
                  : 'border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]',
              )}
              aria-pressed={group === item.id}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title={t('courses.noMatches')} description="" />
      ) : (
      <div className="mt-2 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((course, i) => {
          const isRequired = course.slug === 'computer-basics' || course.slug === 'programmer-basics'
          const prog = progressBySlug.get(course.slug)
          const status = getCourseStatus({
            percent: prog?.percent,
            isStartCourse: isRequired,
          })
          const loc = localizeCourse(course.slug, course.title, course.description)

          return (
            <motion.div
              key={course.id}
              className="h-full"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.3) }}
            >
              <Link to={`/courses/${course.slug}`} className="block h-full">
                <GlassCard
                  hover
                  className={cn(
                    'group relative flex h-full min-h-[188px] flex-col overflow-hidden p-5',
                    isRequired && 'border-[var(--border-hover)] bg-gradient-to-b from-brand-50/90 to-[var(--bg-card)] dark:from-brand-950/35 dark:to-[var(--bg-card)]',
                    status === 'completed' && !isRequired && 'border-brand-700/25',
                    status === 'in_progress' && !isRequired && 'ring-1 ring-brand-600/20',
                  )}
                >
                  <div className="mb-3.5 flex items-start justify-between gap-3">
                    <CourseBrandIcon
                      slug={course.slug}
                      icon={course.icon}
                      size={42}
                      className="transition-transform duration-300 group-hover:scale-[1.05]"
                    />
                    <div className="flex flex-col items-end gap-1.5">
                      {status === 'start' && (
                        <StatusBadge tone="brand">{t('courses.statusStart')}</StatusBadge>
                      )}
                      {status === 'completed' && (
                        <StatusBadge tone="success">
                          <CheckCircle2 className="h-3 w-3" />
                          {t('courses.statusDone')}
                        </StatusBadge>
                      )}
                      {status === 'in_progress' && (
                        <StatusBadge tone="neutral">{t('courses.statusProgress')}</StatusBadge>
                      )}
                    </div>
                  </div>

                  <h2 className="line-clamp-2 text-[16px] font-semibold leading-snug tracking-tight text-ink dark:text-white">
                    {loc.title}
                  </h2>
                  {loc.description ? (
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-soft/80 dark:text-slate-400">
                      {loc.description}
                    </p>
                  ) : null}

                  <div className="mt-auto pt-4">
                    {prog ? (
                      <LearnProgressBar
                        done={prog.completed}
                        total={prog.total}
                        compact
                        className="mb-3"
                      />
                    ) : (
                      <div className="mb-3 h-8" />
                    )}

                    <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3 text-[12px] font-medium text-[var(--text-muted)]">
                      <span>
                        <span className="tabular-nums text-brand-800 dark:text-brand-300">
                          {course.lesson_count}
                        </span>{' '}
                        {countWord(course.lesson_count, t('courses.lessonsOne'), t('courses.lessonsFew'), t('courses.lessonsMany'))}
                        <span className="mx-1.5 text-[var(--text-disabled)]">·</span>
                        {course.category_count}{' '}
                        {countWord(course.category_count, t('courses.categoriesOne'), t('courses.categoriesFew'), t('courses.categoriesMany'))}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent-muted)] px-2.5 py-1 text-[11px] font-semibold text-brand-800 transition group-hover:bg-[var(--color-accent)] group-hover:text-white dark:text-brand-200 dark:group-hover:text-[var(--bg-primary)]"
                        aria-hidden
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          )
        })}
      </div>
      )}
      </>
      )}

      {!isLoading && !isError && data?.length === 0 && (
        <EmptyState
          icon={Library}
          title={t('courses.notFound')}
          description={t('courses.subtitle')}
        />
      )}
    </PageShell>
  )
}

export function CourseDetailPage({ slug }: { slug: string }) {
  const t = useT()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError } = useQuery({ queryKey: ['course', slug], queryFn: () => api.course(slug) })
  const lessonProgress = useQuery({
    queryKey: ['lesson-progress', slug],
    queryFn: () => api.lessonProgress({ courseSlug: slug }),
    enabled: !!user,
  })

  const targetId = useMemo(() => {
    if (!data) return null
    const ordered = data.categories.flatMap((cat) => cat.lessons.map((lesson) => lesson.id))
    const completed = new Set((lessonProgress.data ?? []).filter((row) => row.completed).map((row) => row.lesson_id))
    return playableLessonId(ordered, completed, Boolean(user))
  }, [data, lessonProgress.data, user])

  const waitingProgress = Boolean(user && lessonProgress.isPending)

  if (isLoading || waitingProgress) {
    return (
      <PageShell>
        <Skeleton className="h-10 max-w-md w-full" />
        <Skeleton className="mt-4 h-64 w-full" />
      </PageShell>
    )
  }

  if (isError || !data || !targetId) {
    return (
      <PageShell width="3xl">
        <EmptyState title={t('courses.notFound')} description="" />
      </PageShell>
    )
  }

  return <Navigate to={`/lessons/${targetId}`} replace />
}

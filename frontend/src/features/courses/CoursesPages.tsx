import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { CourseBrandIcon } from '@/features/courses/CourseBrandIcon'
import { useAuthStore } from '@/features/auth/authStore'
import { api } from '@/shared/lib/api'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { LearnProgressBar, LearnStatusBadge } from '@/shared/components/LearnStatus'
import { EmptyState, GlassCard, Skeleton } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

export function CoursesPage() {
  const t = useT()
  const { localizeCourse } = useLocalizedContent()
  const user = useAuthStore((s) => s.user)
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

  return (
    <div className="page-mesh mx-auto max-w-6xl px-4 py-10 md:py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-800 dark:text-brand-300">
            {t('courses.eyebrow')}
          </p>
          <h1 className="text-page-title">{t('courses.title')}</h1>
          <p className="text-muted mt-2.5">{t('courses.subtitle')}</p>
        </div>
        <Link to="/path" className="btn-secondary shrink-0 self-start sm:self-auto">
          {t('courses.openPath')}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {isLoading && (
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState title={t('courses.apiDownTitle')} description={t('courses.apiDownDesc')} />
      )}

      <div className="mt-9 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((course, i) => {
          const isRequired = course.slug === 'programmer-basics'
          const prog = progressBySlug.get(course.slug)
          const done = prog != null && prog.percent >= 100
          const inProgress = prog != null && prog.percent > 0 && prog.percent < 100
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
                    isRequired && 'border-brand-700/35 bg-gradient-to-b from-brand-50/90 to-white dark:from-brand-950/35 dark:to-card-dark',
                    done && !isRequired && 'border-brand-700/25',
                    inProgress && !isRequired && 'ring-1 ring-brand-600/20',
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
                      {isRequired && (
                        <span className="status-chip border-brand-700/30 bg-brand-700 text-white dark:bg-brand-500 dark:text-ink">
                          {t('courses.statusStart')}
                        </span>
                      )}
                      {done && (
                        <span className="status-chip border-brand-700/25 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200">
                          <CheckCircle2 className="h-3 w-3" />
                          {t('courses.statusDone')}
                        </span>
                      )}
                      {inProgress && !done && (
                        <span className="status-chip border-ink/10 bg-ink/[0.04] text-ink-soft dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                          {t('courses.statusProgress')}
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="line-clamp-2 text-[16px] font-semibold leading-snug tracking-tight text-ink dark:text-white">
                    {loc.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-soft/80 dark:text-slate-400">
                    {loc.description}
                  </p>

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

                    <div className="flex items-center justify-between border-t border-ink/[0.07] pt-3 text-[12px] font-medium text-ink-soft dark:border-white/10 dark:text-slate-400">
                      <span>
                        <span className="tabular-nums text-brand-800 dark:text-brand-300">
                          {course.lesson_count}
                        </span>{' '}
                        {t('courses.lessons')}
                        <span className="mx-1.5 text-ink/20 dark:text-white/20">·</span>
                        {course.category_count} {t('courses.categories')}
                      </span>
                      {isRequired && (
                        <span className="text-brand-800 dark:text-brand-300">{t('courses.startHere')}</span>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export function CourseDetailPage({ slug }: { slug: string }) {
  const t = useT()
  const { localizeCourse, localizeCategory, localizeLesson } = useLocalizedContent()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuery({ queryKey: ['course', slug], queryFn: () => api.course(slug) })
  const lessonProgress = useQuery({
    queryKey: ['lesson-progress', slug],
    queryFn: () => api.lessonProgress({ courseSlug: slug }),
    enabled: !!user,
  })

  const learnedMap = useMemo(() => {
    const map = new Map<string, boolean>()
    lessonProgress.data?.forEach((p) => map.set(p.lesson_id, p.completed))
    return map
  }, [lessonProgress.data])

  const totalLessons = data?.lesson_count ?? 0
  const doneLessons = lessonProgress.data?.filter((p) => p.completed).length ?? 0

  if (isLoading) return <Skeleton className="mx-auto mt-10 h-64 max-w-6xl" />
  if (!data) return <EmptyState title={t('courses.notFound')} description="" />

  const courseLoc = localizeCourse(data.slug, data.title, data.description)

  return (
    <div className="page-mesh mx-auto max-w-6xl px-4 py-10 md:py-12">
      <div className="mb-8 flex flex-wrap items-start gap-5">
        <CourseBrandIcon slug={data.slug} icon={data.icon} size={56} />
        <div className="min-w-0 flex-1">
          {data.slug === 'programmer-basics' && (
            <span className="status-chip mb-2 border-brand-700/30 bg-brand-700 text-white">
              {t('courses.requiredStart')}
            </span>
          )}
          <h1 className="text-page-title mt-1">{courseLoc.title}</h1>
          <p className="text-muted mt-2 max-w-2xl">{courseLoc.description}</p>
          {user ? (
            <div className="mt-5 max-w-md">
              <LearnProgressBar done={doneLessons} total={totalLessons} />
            </div>
          ) : (
            <p className="mt-3 text-[14px] text-ink-soft">
              <Link to="/login" className="font-semibold text-brand-800 hover:underline">
                {t('courses.loginLink')}
              </Link>
              {t('courses.loginToTrack')}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-9">
        {data.categories.map((cat) => {
          const catDone = cat.lessons.filter((l) => learnedMap.get(l.id)).length
          const catTitle = localizeCategory(data.slug, cat.slug, cat.title)
          return (
            <section key={cat.id}>
              <div className="mb-1 flex flex-wrap items-end justify-between gap-2 border-b border-ink/[0.07] pb-3 dark:border-white/10">
                <h2 className="text-lg font-semibold tracking-tight text-ink dark:text-white">{catTitle}</h2>
                {user && (
                  <p className="text-[12px] font-medium tabular-nums text-ink-soft dark:text-slate-400">
                    {catDone}/{cat.lessons.length} {t('courses.learnedCount')}
                  </p>
                )}
              </div>
              <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                {cat.lessons.map((lesson) => {
                  const learned = learnedMap.get(lesson.id) ?? false
                  const lessonLoc = localizeLesson(data.slug, cat.slug, lesson.keys, {
                    title: lesson.title,
                  })
                  return (
                    <Link key={lesson.id} to={`/lessons/${lesson.id}`}>
                      <GlassCard
                        hover
                        className={cn(
                          'flex flex-col gap-1.5 !p-4',
                          learned &&
                            'border-brand-700/30 bg-gradient-to-r from-brand-50/80 to-white dark:from-brand-950/30 dark:to-card-dark',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold leading-snug tracking-tight text-ink dark:text-white">
                              {lessonLoc.title}
                            </p>
                            <p className="mt-1 font-mono text-[13px] font-medium text-brand-800 dark:text-brand-300">
                              {formatShortcut(lesson.keys)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            {user && <LearnStatusBadge learned={learned} size="sm" />}
                            <span className="text-[11px] font-medium tabular-nums text-ink-soft/80">
                              +{lesson.xp_reward} XP
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/path" className="btn-secondary">
          {t('courses.path')}
        </Link>
        <Link to={`/training?course=${slug}`} className="btn-primary">
          {t('courses.training')}
        </Link>
        <Link to={`/exam?course=${slug}`} className="btn-secondary">
          {t('courses.exam')}
        </Link>
      </div>
    </div>
  )
}

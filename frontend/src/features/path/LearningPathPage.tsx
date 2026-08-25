import { Check, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CourseBrandIcon } from '@/features/courses/CourseBrandIcon'
import { type NodeStatus } from '@/features/path/growthPath'
import { ROAD_VIEW_W, roadCurve, roadHeight, roadWaypoints, traveledRatio } from '@/features/path/pathRoad'
import { useGrowthPath, type ResolvedNode } from '@/features/path/useGrowthPath'
import { PageHeader, PageShell } from '@/shared/components/PageLayout'
import { GlassCard, ProgressBar, Skeleton, StatusBadge } from '@/shared/components/ui'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { cn } from '@/shared/lib/utils'

function statusTone(status: NodeStatus) {
  if (status === 'done') return 'success' as const
  if (status === 'progress') return 'brand' as const
  if (status === 'start') return 'neutral' as const
  return 'locked' as const
}

function StatusPill({ status }: { status: NodeStatus }) {
  const t = useT()
  return <StatusBadge tone={statusTone(status)}>{t(`status.${status}`)}</StatusBadge>
}

function useNodeTitle() {
  const t = useT()
  const { localizeCourse } = useLocalizedContent()
  return (node: ResolvedNode) =>
    node.course
      ? localizeCourse(node.course.slug, node.course.title, node.course.description).title
      : t('path.masterFallback')
}

function JourneyRoad({
  nodes,
  nextId,
}: {
  nodes: ResolvedNode[]
  nextId?: string
}) {
  const titleOf = useNodeTitle()
  const points = roadWaypoints(nodes.length)
  const height = roadHeight(nodes.length)
  const curve = roadCurve(points)
  const nextIndex = nextId ? nodes.findIndex((n) => n.id === nextId) : -1
  const traveled = traveledRatio(nextIndex, nodes.length)

  return (
    <div className="relative mx-auto w-full max-w-[1080px]" style={{ height }}>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${ROAD_VIEW_W} ${height}`}
        fill="none"
        aria-hidden
      >
        <path className="path-curve-bed" d={curve} />
        <path
          className="path-curve-progress"
          d={curve}
          pathLength={1}
          strokeDasharray={`${traveled} 1`}
        />
        <path
          className={cn('path-curve-lane', nextIndex >= 0 && 'path-curve-lane--flow')}
          d={curve}
        />
      </svg>

      <ol className="absolute inset-0">
        {nodes.map((node, i) => {
          const point = points[i]
          const isNext = node.id === nextId
          const isLeft = i % 2 === 0
          const lessonsDone = node.progress?.completed_lessons ?? 0
          const lessonsTotal = node.course?.lesson_count ?? 0

          return (
            <li
              key={node.id}
              className="absolute"
              style={{
                left: `${(point.x / ROAD_VIEW_W) * 100}%`,
                top: `${(point.y / height) * 100}%`,
              }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <span
                  className={cn(
                    'path-waypoint mx-auto',
                    node.status === 'done' && 'path-waypoint--done',
                    isNext && 'path-waypoint--now',
                  )}
                >
                  {node.kind === 'milestone' ? (
                    <Sparkles className="h-4 w-4" />
                  ) : node.status === 'done' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </span>
                <Link
                  to={node.slug ? `/courses/${node.slug}` : '/courses'}
                  className={cn(
                    'absolute top-1/2 w-[14rem] -translate-y-1/2 rounded-[var(--radius-card)] border p-3.5 shadow-[var(--shadow-sm)] transition sm:w-[17.5rem] sm:p-4 lg:w-[20rem] lg:p-5',
                    isLeft
                      ? 'left-[calc(100%+0.95rem)] sm:left-[calc(100%+1.2rem)]'
                      : 'right-[calc(100%+0.95rem)] sm:right-[calc(100%+1.2rem)]',
                    isNext
                      ? 'border-brand-600/40 bg-brand-50/90 ring-1 ring-brand-600/15 dark:bg-brand-950/40'
                      : 'border-[var(--border-default)] bg-[var(--bg-elevated)]/95 hover:border-brand-600/30',
                    node.status === 'locked' && !isNext && 'opacity-70',
                  )}
                >
                  <span className="flex items-start gap-3 sm:gap-3.5">
                    {node.course ? (
                      <CourseBrandIcon slug={node.course.slug} icon={node.course.icon} size={28} />
                    ) : (
                      <Sparkles className="mt-1 h-7 w-7 shrink-0 text-brand-600" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <StatusPill status={node.status} />
                      <span className="mt-1.5 block text-[15px] font-semibold leading-snug text-[var(--text-primary)] sm:text-base">
                        {titleOf(node)}
                      </span>
                      {lessonsTotal > 0 && (
                        <span className="mt-1.5 block text-xs tabular-nums text-[var(--text-muted)]">
                          {lessonsDone}/{lessonsTotal}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function LearningPathPage() {
  const t = useT()
  const titleOf = useNodeTitle()
  const {
    journey,
    coursesLoading,
    progressLoading,
    completedCourses,
    totalCourses,
    next,
    rank,
    user,
    xp,
  } = useGrowthPath()

  const loading = coursesLoading || progressLoading

  return (
    <PageShell width="6xl">
      <PageHeader
        title={t('path.title')}
        subtitle={t('path.subtitle')}
        actions={
          <Link to="/courses" className="btn-secondary">
            {t('path.catalog')}
          </Link>
        }
      />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
            {t('path.nextStage')}
          </p>
          <p className="font-display mt-1 truncate text-xl font-semibold text-[var(--text-primary)]">
            {next ? titleOf(next) : t('path.masterFallback')}
          </p>
          <p className="text-muted mt-1 text-sm">
            {t('path.summary', { xp, done: completedCourses, total: totalCourses })} · {rank}
          </p>
        </div>
        <Link to={next?.slug ? `/courses/${next.slug}` : '/courses'} className="btn-primary">
          {t('path.continueStage')}
        </Link>
      </div>

      {!user && (
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          {t('path.guestText')}{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {t('nav.register')}
          </Link>
        </p>
      )}

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mx-auto h-16 w-64 rounded-full" />
          ))}
        </div>
      ) : (
        <JourneyRoad nodes={journey} nextId={next?.id} />
      )}
    </PageShell>
  )
}

export function NextStepCard() {
  const t = useT()
  const titleOf = useNodeTitle()
  const { next, completedCourses, totalCourses, xp, user } = useGrowthPath()

  if (!user) {
    return (
      <GlassCard className="border-brand-600/25 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{t('dashboard.today')}</p>
        <h2 className="font-display mt-1 text-xl font-semibold">{t('path.title')}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('path.guestText')}</p>
        <div className="mt-4 flex gap-2">
          <Link to="/path" className="btn-primary">
            {t('nav.path')}
          </Link>
          <Link to="/login" className="btn-secondary">
            {t('nav.login')}
          </Link>
        </div>
      </GlassCard>
    )
  }

  const href = next?.slug ? `/courses/${next.slug}` : '/path'

  return (
    <GlassCard className="border-brand-600/25 bg-gradient-to-br from-brand-50/80 to-white p-5 md:p-6 dark:from-brand-950/40 dark:to-slate-900">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
        {t('dashboard.today')}
      </p>
      <h2 className="font-display mt-2 text-2xl font-semibold tracking-tight">
        {next ? titleOf(next) : t('path.masterFallback')}
      </h2>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
        {t('path.summary', { xp, done: completedCourses, total: totalCourses })}
      </p>
      {next && next.percent > 0 && next.percent < 100 ? (
        <div className="mt-4 max-w-md">
          <ProgressBar value={next.percent} />
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={href} className="btn-primary">
          {t('dashboard.continueLesson')}
        </Link>
        <Link to="/path" className="btn-secondary">
          {t('nav.path')}
        </Link>
      </div>
    </GlassCard>
  )
}

export function PathStageStrip() {
  const t = useT()
  const titleOf = useNodeTitle()
  const { journey, coursesLoading, next } = useGrowthPath()
  const stages = journey.filter((n) => n.kind === 'course').slice(0, 4)

  if (coursesLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (stages.length === 0) return null

  return (
    <section aria-labelledby="dashboard-stages">
      <h2 id="dashboard-stages" className="text-h2 mb-3">
        {t('dashboard.stagesTitle')}
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((node, i) => (
          <li key={node.id}>
            <Link
              to={node.slug ? `/courses/${node.slug}` : '/path'}
              className={cn(
                'flex h-full flex-col rounded-[var(--radius-lg)] border px-3.5 py-3 transition',
                next?.id === node.id
                  ? 'border-brand-600/40 bg-brand-50/80 ring-1 ring-brand-600/15 dark:bg-brand-950/30'
                  : node.status === 'done'
                    ? 'border-brand-600/20 bg-[var(--bg-elevated)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-elevated)] opacity-75',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tabular-nums text-[var(--text-muted)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <StatusPill status={node.status} />
              </span>
              <span className="mt-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">
                {titleOf(node)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

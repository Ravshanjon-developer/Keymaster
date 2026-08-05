import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Lock, Sparkles, Zap } from 'lucide-react'
import { Link } from 'react-router'

import { CourseBrandIcon } from '@/features/courses/CourseBrandIcon'
import { difficultyKey, type NodeStatus } from '@/features/path/growthPath'
import { useGrowthPath, type ResolvedNode } from '@/features/path/useGrowthPath'
import { GlassCard, ProgressBar, Skeleton, StatusBadge } from '@/shared/components/ui'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { cn } from '@/shared/lib/utils'

function laneClass(lane: ResolvedNode['lane']) {
  if (lane === 'left') return 'md:col-start-1 md:justify-self-end'
  if (lane === 'right') return 'md:col-start-3 md:justify-self-start'
  return 'md:col-start-2 md:justify-self-center'
}

function shapeClass(shape: ResolvedNode['shape'], status: ResolvedNode['status']) {
  const base =
    status === 'locked'
      ? 'border-ink/10 bg-white/70 opacity-70 dark:border-white/10 dark:bg-slate-900/50'
      : status === 'done'
        ? 'border-brand-600/50 bg-gradient-to-br from-brand-50 to-white shadow-[0_0_0_1px_rgb(37_99_235_/_0.15),0_16px_40px_-20px_rgb(37_99_235_/_0.45)] dark:from-brand-950/50 dark:to-slate-900'
        : status === 'progress'
          ? 'border-brand-600/40 bg-white ring-2 ring-brand-600/20 dark:bg-slate-900'
          : 'border-ink/15 bg-white dark:border-white/15 dark:bg-slate-900'

  if (shape === 'diamond') return cn(base, 'clip-path-none rotate-0 rounded-2xl md:rounded-[1.75rem]')
  if (shape === 'hex') return cn(base, 'rounded-[1.75rem] md:rounded-[2rem]')
  if (shape === 'wide') return cn(base, 'rounded-2xl md:min-w-[20rem]')
  return cn(base, 'rounded-xl')
}

function StatusPill({ status }: { status: NodeStatus }) {
  const t = useT()
  return (
    <StatusBadge
      tone={
        status === 'done'
          ? 'success'
          : status === 'progress'
            ? 'brand'
            : status === 'locked'
              ? 'locked'
              : 'neutral'
      }
      className={
        status === 'start'
          ? 'border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink'
          : status === 'done'
            ? 'border-transparent bg-success-600 text-white'
            : undefined
      }
    >
      {status === 'locked' && <Lock className="h-3 w-3" />}
      {t(`status.${status}`)}
    </StatusBadge>
  )
}

function PathNodeCard({ node, index }: { node: ResolvedNode; index: number }) {
  const t = useT()
  const { localizeCourse } = useLocalizedContent()
  const courseTitle = node.course
    ? localizeCourse(node.course.slug, node.course.title, node.course.description).title
    : ''
  const href =
    node.kind === 'course' && node.slug && node.unlocked
      ? `/courses/${node.slug}`
      : node.kind === 'course' && node.slug
        ? `/courses/${node.slug}`
        : undefined

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: Math.min(index * 0.04, 0.35), type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={node.unlocked ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn(
        'relative w-full max-w-sm border p-4 transition',
        shapeClass(node.shape, node.status),
      )}
    >
      {node.kind === 'start' && (
        <div className="text-center">
          <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-brand-800 dark:text-brand-300">
            {t('path.startLabel')}
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)]">
            {t('path.startTitle')}
          </p>
          <p className="text-muted mt-1 text-sm">{t('path.startSub')}</p>
        </div>
      )}

      {node.kind === 'milestone' && (
        <div className="text-center">
          <Sparkles className="mx-auto h-6 w-6 text-brand-600" />
          <p className="font-display mt-2 text-2xl font-bold text-[var(--text-primary)]">{node.careerTitle}</p>
          <p className="text-muted mt-1 text-sm">{t('path.milestoneSub')}</p>
          <ProgressBar value={node.percent} className="mx-auto mt-4 max-w-[12rem]" />
          <div className="mt-3">
            <StatusPill status={node.status} />
          </div>
        </div>
      )}

      {node.kind === 'course' && node.course && (
        <>
          <div className="flex items-start gap-3">
            <CourseBrandIcon slug={node.course.slug} icon={node.course.icon} size={42} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={node.status} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t(difficultyKey(node.difficulty))} · L{node.difficulty}
                </span>
              </div>
              <p className="font-display mt-1.5 text-lg font-semibold leading-tight text-[var(--text-primary)]">
                {node.careerTitle}
              </p>
              <p className="text-muted mt-0.5 truncate text-sm">{courseTitle}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-[var(--bg-muted)] px-2 py-2">
              <p className="text-[var(--text-muted)]">{t('path.lessons')}</p>
              <p className="font-semibold text-[var(--text-primary)]">
                {node.progress?.completed_lessons ?? 0}/{node.course.lesson_count}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-muted)] px-2 py-2">
              <p className="text-[var(--text-muted)]">{t('path.courseXp')}</p>
              <p className="font-semibold text-brand-700 dark:text-brand-300">
                {node.progress?.xp_earned ?? 0}
                {node.progress?.xp_total != null ? `/${node.progress.xp_total}` : ''}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-muted)] px-2 py-2">
              <p className="text-[var(--text-muted)]">{t('path.progress')}</p>
              <p className="font-semibold text-[var(--text-primary)]">{Math.round(node.percent)}%</p>
            </div>
          </div>

          <ProgressBar
            value={Math.min(100, node.percent)}
            className="mt-3"
            barClassName={node.status === 'done' ? 'bg-success-600' : 'bg-brand-600'}
          />

          <div className="mt-3 flex items-start justify-between gap-2 text-xs font-semibold">
            <span
              className={
                node.unlocked ? 'text-brand-700 dark:text-brand-300' : 'text-[var(--text-secondary)]'
              }
            >
              {node.unlocked ? t('path.openCourse') : (node.unlockHint ?? t('path.needProgress'))}
            </span>
            {node.unlocked && <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-700" />}
          </div>
        </>
      )}
    </motion.div>
  )

  // Always open existing course pages — path lock is guidance, catalog stays fully usable
  if (href) {
    return (
      <Link to={href} className="block w-full max-w-sm">
        {inner}
      </Link>
    )
  }

  return <div className="w-full max-w-sm">{inner}</div>
}

export function LearningPathPage() {
  const t = useT()
  const { nodes, coursesLoading, progressLoading, completedCourses, totalCourses, next, rank, user, xp } =
    useGrowthPath()

  return (
    <div className="relative overflow-hidden">
      {/* Blueprint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgb(11 31 51 / 0.06) 1px, transparent 1px), linear-gradient(90deg, rgb(11 31 51 / 0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-[40%] h-80 w-80 rounded-full bg-ink/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-800 dark:text-brand-300">
            {t('path.eyebrow')}
          </p>
          <h1 className="text-page-title mt-2 md:text-[2.5rem]">{t('path.title')}</h1>
          <p className="text-muted mt-3 max-w-2xl">{t('path.subtitle')}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <GlassCard className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('path.level')}</p>
              <p className="font-display mt-1 text-xl font-bold leading-snug text-[var(--text-primary)]">{rank}</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('path.xp')}</p>
              <p className="font-display mt-1 flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
                <Zap className="h-5 w-5 text-brand-600" />
                {xp}
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{t('path.completed')}</p>
              <p className="font-display mt-1 text-2xl font-bold text-[var(--text-primary)]">
                {completedCourses}/{totalCourses} {t('path.coursesWord')}
              </p>
            </GlassCard>
            <GlassCard className="border-brand-600/30 bg-gradient-to-br from-brand-50/90 to-white p-4 dark:from-brand-950/40 dark:to-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                {t('path.nextStage')}
              </p>
              <p className="font-display mt-1 text-xl font-bold">
                {next?.careerTitle ?? t('path.masterFallback')}
              </p>
              {next?.course && (
                <Link to={`/courses/${next.course.slug}`} className="mt-2 inline-flex text-sm font-semibold text-brand-700 hover:underline">
                  {t('path.continueArrow')}
                </Link>
              )}
            </GlassCard>
          </div>

          {!user && (
            <p className="mt-4 rounded-xl border border-ink/10 bg-white/80 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
              {t('path.loginHint')}{' '}
              <Link to="/login" className="font-semibold text-brand-700 hover:underline">
                {t('path.login')}
              </Link>
            </p>
          )}
        </motion.section>

        {(coursesLoading || progressLoading) && (
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mx-auto h-36 max-w-sm" />
            ))}
          </div>
        )}

        <div className="relative">
          <div
            aria-hidden
            className="absolute bottom-10 left-1/2 top-10 hidden w-px -translate-x-1/2 bg-gradient-to-b from-brand-600 via-brand-400/40 to-ink/15 md:block dark:to-white/15"
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-x-4 md:gap-y-10">
            <AnimatePresence>
              {nodes.map((node, index) => (
                <div key={node.id} className={cn('relative flex justify-center', laneClass(node.lane))}>
                  {index > 0 && (
                    <motion.div
                      aria-hidden
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      className="absolute -top-8 left-1/2 h-8 w-px origin-top bg-brand-600/30 md:hidden"
                    />
                  )}
                  <PathNodeCard node={node} index={index} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-3">
          <Link to="/courses" className="btn-secondary">
            {t('path.catalog')}
          </Link>
          {next?.course && (
            <Link to={`/courses/${next.course.slug}`} className="btn-primary">
              {t('path.nextCourse')}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export function NextStepCard() {
  const t = useT()
  const { next, rank, completedCourses, totalCourses, xp, user } = useGrowthPath()

  if (!user) {
    return (
      <GlassCard className="border-brand-600/25 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{t('path.nextStepEyebrow')}</p>
        <h2 className="font-display mt-1 text-xl font-semibold">{t('path.guestTitle')}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('path.guestText')}</p>
        <div className="mt-4 flex gap-2">
          <Link to="/path" className="btn-primary">
            {t('path.openPath')}
          </Link>
          <Link to="/login" className="btn-secondary">
            {t('path.login')}
          </Link>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="border-brand-600/25 bg-gradient-to-br from-brand-50/80 to-white p-5 dark:from-brand-950/40 dark:to-slate-900">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
        {t('path.nextStepEyebrow')}
      </p>
      <h2 className="font-display mt-1 text-xl font-semibold">{rank}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {t('path.summary', { xp, done: completedCourses, total: totalCourses })}
        {next ? t('path.summaryNext', { next: next.careerTitle }) : ''}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {next?.course ? (
          <Link to={`/courses/${next.course.slug}`} className="btn-primary">
            {t('path.continue')}
          </Link>
        ) : null}
        <Link to="/path" className="btn-secondary">
          {t('path.myPath')}
        </Link>
      </div>
    </GlassCard>
  )
}

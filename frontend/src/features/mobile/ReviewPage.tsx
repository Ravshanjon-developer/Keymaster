import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { api } from '@/shared/lib/api'
import { reviewCardExplain, reviewCardMeaning } from '@/shared/lib/reviewCard'
import { useT, useLocaleStore } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { EmptyState, GlassCard, KeyCombo } from '@/shared/components/ui'
import { PageHeader, PageShell, SkeletonBlock } from '@/shared/components/PageLayout'
import { cn } from '@/shared/lib/utils'

const SWIPE_THRESHOLD = 80
const DEFAULT_COURSE = 'programmer-basics'

export function ReviewPage() {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const { localizeLesson, localizeCourse } = useLocalizedContent()
  const [params, setParams] = useSearchParams()
  const rawCourse = params.get('course')
  const courseFilter = rawCourse === 'all' ? undefined : (rawCourse ?? DEFAULT_COURSE)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.courses(),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['random', 'review', 'v3', courseFilter ?? 'all'],
    queryFn: () =>
      api.randomLessons({
        course_slug: courseFilter,
        limit: 40,
        browser_safe: false,
      }),
  })

  useEffect(() => {
    setIndex(0)
    setFlipped(false)
  }, [courseFilter])

  useEffect(() => {
    setFlipped(false)
  }, [index])

  useEffect(() => {
    if (rawCourse === null) {
      setParams({ course: DEFAULT_COURSE }, { replace: true })
    }
  }, [rawCourse, setParams])

  const courseTitleBySlug = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of coursesQuery.data ?? []) {
      map.set(c.slug, localizeCourse(c.slug, c.title, c.description).title)
    }
    return map
  }, [coursesQuery.data, localizeCourse])

  const total = data?.length ?? 0
  const current = data?.[index]
  const loc = current
    ? localizeLesson(current.course_slug ?? courseFilter, current.category_slug ?? undefined, current.keys, {
        title: current.title,
        action_prompt: current.action_prompt,
        usage_example: current.usage_example ?? undefined,
        description: current.description ?? undefined,
      })
    : null

  const meaning = current
    ? reviewCardMeaning({
        keys: current.keys,
        title: loc?.title ?? current.title,
        action_prompt: loc?.action_prompt ?? current.action_prompt,
        usage_example: loc?.usage_example ?? current.usage_example,
        description: loc?.description ?? current.description,
      })
    : ''

  const explain = current
    ? reviewCardExplain(
        {
          keys: current.keys,
          title: loc?.title ?? current.title,
          action_prompt: loc?.action_prompt ?? current.action_prompt,
          usage_example: loc?.usage_example ?? current.usage_example,
          description: loc?.description ?? current.description,
        },
        locale,
      )
    : ''

  const courseLabel = current?.course_slug
    ? (courseTitleBySlug.get(current.course_slug) ?? current.course_slug)
    : null

  const go = useCallback(
    (delta: number) => {
      if (!total) return
      setFlipped(false)
      setIndex((i) => (i + delta + total) % total)
    },
    [total],
  )

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-120, 120], [-6, 6])
  const opacity = useTransform(x, [-160, 0, 160], [0.5, 1, 0.5])

  const onCourseChange = (value: string) => {
    setParams(value ? { course: value } : { course: DEFAULT_COURSE })
  }

  if (isLoading) {
    return (
      <PageShell width="2xl">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="mt-6 h-80 w-full max-w-md mx-auto rounded-[var(--radius-card)]" />
      </PageShell>
    )
  }
  if (isError || !data?.length) {
    return (
      <PageShell width="2xl">
        <EmptyState title={t('mobile.reviewEmptyTitle')} description={t('mobile.reviewEmptyDesc')} />
      </PageShell>
    )
  }

  return (
    <PageShell width="2xl" className="max-w-md">
      <PageHeader title={t('mobile.reviewTitle')} subtitle={t('mobile.reviewSubtitle')} />

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {t('mobile.reviewCourseLabel')}
        </span>
        <select
          className="mt-1.5 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)]"
          value={rawCourse ?? DEFAULT_COURSE}
          onChange={(e) => onCourseChange(e.target.value)}
        >
          <option value={DEFAULT_COURSE}>
            {courseTitleBySlug.get(DEFAULT_COURSE) ?? t('mobile.reviewDefaultCourse')}
          </option>
          {(coursesQuery.data ?? [])
            .filter((c) => c.slug !== DEFAULT_COURSE)
            .map((c) => (
              <option key={c.slug} value={c.slug}>
                {localizeCourse(c.slug, c.title, c.description).title}
              </option>
            ))}
          <option value="all">{t('mobile.reviewAllCourses')}</option>
        </select>
      </label>

      <div className="mt-6 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] transition active:scale-95"
          aria-label={t('mobile.prevCard')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold tabular-nums text-[var(--text-secondary)]">
          {index + 1} / {total}
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] transition active:scale-95"
          aria-label={t('mobile.nextCard')}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="relative mt-4 min-h-[22rem] touch-pan-y">
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.div
              key={current.id}
              style={{ x, rotate, opacity }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.35}
              onDragEnd={(_, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD) go(1)
                else if (info.offset.x > SWIPE_THRESHOLD) go(-1)
                x.set(0)
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setFlipped((v) => !v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setFlipped((v) => !v)
                  }
                }}
                aria-pressed={flipped}
                aria-label={flipped ? t('mobile.flipBack') : t('mobile.flipExplain')}
                className="rounded-[var(--radius-card)] outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
                style={{ perspective: '1400px' }}
              >
                <div
                  className={cn(
                    'relative grid transition-transform ease-[cubic-bezier(0.4,0.0,0.2,1)]',
                    '[transform-style:preserve-3d]',
                    flipped && '[transform:rotateY(180deg)]',
                  )}
                  style={{ transitionDuration: '550ms' }}
                >
                  <GlassCard
                    className={cn(
                      'col-start-1 row-start-1 cursor-pointer p-6 text-center shadow-lg',
                      '[backface-visibility:hidden] [-webkit-backface-visibility:hidden]',
                      flipped && 'pointer-events-none',
                    )}
                    hover
                  >
                    {courseLabel ? (
                      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                        {courseLabel}
                      </p>
                    ) : null}
                    <div className="flex justify-center">
                      <KeyCombo keys={current.keys} learned />
                    </div>
                    {meaning ? (
                      <>
                        <div className="my-5 h-px bg-[var(--border-default)]" />
                        <p className="text-xl font-semibold leading-snug text-[var(--text-primary)]">
                          {meaning}
                        </p>
                      </>
                    ) : null}
                    <p className="mt-5 text-xs font-medium text-[var(--text-muted)]">{t('mobile.flipHint')}</p>
                    <button
                      type="button"
                      className="btn-secondary mt-3"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlipped(true)
                      }}
                    >
                      {t('mobile.flipExplain')}
                    </button>
                  </GlassCard>

                  <GlassCard
                    className={cn(
                      'col-start-1 row-start-1 cursor-pointer p-6 text-center shadow-lg',
                      '[backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)]',
                      !flipped && 'pointer-events-none',
                    )}
                  >
                    {courseLabel ? (
                      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                        {courseLabel}
                      </p>
                    ) : null}
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
                      {t('mobile.cardBackLabel')}
                    </p>
                    <div className="flex justify-center">
                      <KeyCombo keys={current.keys} learned />
                    </div>
                    {meaning ? (
                      <p className="mt-4 text-lg font-semibold leading-snug text-[var(--text-primary)]">
                        {meaning}
                      </p>
                    ) : null}
                    <p className="mt-3 text-left text-sm leading-relaxed text-[var(--text-secondary)]">
                      {explain}
                    </p>
                    <button
                      type="button"
                      className="btn-secondary mt-4"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFlipped(false)
                      }}
                    >
                      {t('mobile.flipBack')}
                    </button>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-muted mt-4 text-center text-xs">{t('mobile.swipeHint')}</p>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {data.map((lesson, i) => (
          <button
            key={lesson.id}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              'h-2 rounded-full transition-all',
              i === index ? 'w-6 bg-brand-600' : 'w-2 bg-[var(--bg-muted)]',
            )}
            aria-label={t('mobile.cardN', { n: i + 1 })}
          />
        ))}
      </div>
    </PageShell>
  )
}

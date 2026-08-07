import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { api } from '@/shared/lib/api'
import { formatShortcut } from '@/shared/lib/hotkeys'
import { useT } from '@/shared/i18n'
import { useLocalizedContent } from '@/shared/i18n/contentLocalize'
import { EmptyState, GlassCard, KeyCombo } from '@/shared/components/ui'
import { PageHeader, PageShell, SkeletonBlock } from '@/shared/components/PageLayout'
import { cn } from '@/shared/lib/utils'

const SWIPE_THRESHOLD = 80

export function ReviewPage() {
  const t = useT()
  const { localizeLesson } = useLocalizedContent()
  const [params] = useSearchParams()
  const course = params.get('course') ?? undefined
  const [index, setIndex] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['random', 'review', course],
    queryFn: () => api.randomLessons({ course_slug: course, limit: 40 }),
  })

  const total = data?.length ?? 0
  const current = data?.[index]
  const loc = current
    ? localizeLesson(current.course_slug ?? course, current.category_slug ?? undefined, current.keys, {
        title: current.title,
        action_prompt: current.action_prompt,
      })
    : null

  const go = useCallback(
    (delta: number) => {
      if (!total) return
      setIndex((i) => (i + delta + total) % total)
    },
    [total],
  )

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-120, 120], [-6, 6])
  const opacity = useTransform(x, [-160, 0, 160], [0.5, 1, 0.5])

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
      <PageHeader
        eyebrow={t('mobile.reviewEyebrow')}
        title={t('mobile.reviewTitle')}
        subtitle={t('mobile.reviewSubtitle')}
      />

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
          {current && loc && (
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
              <GlassCard className="overflow-hidden p-6 text-center shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {loc.title ?? current.title}
                </p>
                <div className="mt-6 flex justify-center">
                  <KeyCombo keys={current.keys} learned />
                </div>
                <p className="mt-4 font-mono text-2xl font-bold tracking-wide text-brand-800 dark:text-brand-200">
                  {formatShortcut(current.keys)}
                </p>
                <div className="my-5 h-px bg-[var(--border-default)]" />
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {loc.action_prompt ?? current.action_prompt}
                </p>
                <p className="text-muted mt-4 text-sm leading-relaxed">
                  {loc.usage_example ?? t('mobile.reviewNoExample')}
                </p>
              </GlassCard>
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

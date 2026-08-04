import { Check, CircleDashed } from 'lucide-react'

import { useT } from '@/shared/i18n'
import { cn } from '@/shared/lib/utils'

export function LearnStatusBadge({
  learned,
  size = 'md',
  className,
}: {
  learned: boolean
  size?: 'sm' | 'md'
  className?: string
}) {
  const t = useT()
  return (
    <span
      className={cn(
        'status-chip',
        size === 'sm' ? 'text-[10px]' : 'text-[11px]',
        learned
          ? 'border-success-600/25 bg-success-50 text-success-700 dark:border-success-400/30 dark:bg-success-500/15 dark:text-success-400'
          : 'border-ink/10 bg-ink/[0.04] text-ink-soft dark:border-white/10 dark:bg-white/5 dark:text-slate-400',
        className,
      )}
    >
      {learned ? (
        <Check className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      ) : (
        <CircleDashed className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      )}
      {learned ? t('learn.learned') : t('learn.notLearned')}
    </span>
  )
}

export function LearnProgressBar({
  done,
  total,
  className,
  compact = false,
}: {
  done: number
  total: number
  className?: string
  compact?: boolean
}) {
  const t = useT()
  const percent = total ? Math.round((done / total) * 100) : 0
  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'mb-1.5 flex items-center justify-between font-medium',
          compact ? 'text-[12px]' : 'text-[13px]',
        )}
      >
        <span className="text-ink-soft dark:text-slate-400">
          {done}/{total} {t('learn.progressLabel')}
        </span>
        <span className="tabular-nums text-brand-800 dark:text-brand-300">{percent}%</span>
      </div>
      <div
        className={cn(
          'overflow-hidden rounded-full bg-ink/[0.08] dark:bg-white/10',
          compact ? 'h-2' : 'h-2.5',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            percent >= 100 ? 'bg-success-600' : percent > 0 ? 'bg-brand-600' : 'bg-transparent',
          )}
          style={{ width: `${Math.max(percent > 0 ? 6 : 0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  )
}

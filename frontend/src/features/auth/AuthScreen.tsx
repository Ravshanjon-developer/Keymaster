import { Link } from 'react-router-dom'

import { GlassCard } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

function AuthScreenHeader({
  title,
  subtitle,
  banner,
  compact,
}: {
  title: string
  subtitle?: string
  banner?: React.ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'border-b border-[var(--border-default)] bg-gradient-to-br from-brand-50/90 via-[var(--bg-elevated)] to-accent-50/40 dark:from-brand-950/50 dark:via-[var(--bg-elevated)] dark:to-accent-950/25',
        compact ? 'px-5 py-4' : 'px-6 py-6',
      )}
    >
      <Link
        to="/"
        className="font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-700 hover:text-brand-800 dark:text-brand-300"
      >
        KeyMaster
      </Link>
      <h1
        className={cn(
          'font-display mt-2 font-bold tracking-tight text-[var(--text-primary)]',
          compact ? 'text-xl md:text-2xl' : 'mt-3 text-2xl md:text-[1.65rem]',
        )}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm leading-snug text-[var(--text-muted)]">{subtitle}</p>
      )}
      {banner}
    </div>
  )
}

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  banner,
  compact = false,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  banner?: React.ReactNode
  /** Компактное тело формы — шапка как на входе, меньше отступы у полей */
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'page-mesh mx-auto flex max-w-md flex-col justify-center px-4',
        compact ? 'py-3 pb-24 lg:py-6 lg:pb-10' : 'min-h-[min(32rem,calc(100dvh-6rem))] py-12 pb-28 lg:pb-12',
      )}
    >
      <GlassCard className="overflow-hidden p-0 shadow-lg shadow-brand-900/5 ring-1 ring-[var(--border-default)]">
        <AuthScreenHeader title={title} subtitle={subtitle} banner={banner} compact={compact} />
        <div className={compact ? 'px-5 py-4' : 'px-6 py-6'}>{children}</div>
        {footer && (
          <div
            className={cn(
              'border-t border-[var(--border-default)] bg-[var(--bg-soft)] text-center text-sm text-[var(--text-secondary)] dark:bg-brand-950/20',
              compact ? 'px-5 py-3' : 'px-6 py-4',
            )}
          >
            {footer}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

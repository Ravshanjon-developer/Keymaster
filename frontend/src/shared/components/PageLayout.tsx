import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

/** Unified page container: mesh background + max width + responsive padding */
export function PageShell({
  children,
  className,
  width = '6xl',
}: {
  children: ReactNode
  className?: string
  width?: '2xl' | '3xl' | '5xl' | '6xl'
}) {
  const maxW = {
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
  }[width]

  return (
    <div
      className={cn(
        'page-mesh mx-auto w-full px-4 py-8 pb-24 md:py-10 lg:pb-10',
        maxW,
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-800 dark:text-brand-300">
            {eyebrow}
          </p>
        )}
        <h1 className={cn('text-page-title', eyebrow && 'mt-2')}>{title}</h1>
        {subtitle && <p className="text-muted mt-2.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function PageSection({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('mt-8', className)}>
      {title && <h2 className="text-h2 mb-4">{title}</h2>}
      {children}
    </section>
  )
}

export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'glass rounded-[var(--radius-card)] p-4 md:p-5',
        accent && 'border-brand-600/30 bg-gradient-to-br from-brand-50/90 to-[var(--bg-elevated)] dark:from-brand-950/40',
      )}
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <p className="text-caption font-semibold uppercase tracking-wider">{label}</p>
      <div className="font-display mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">{value}</div>
      {hint && <div className="mt-2 text-sm text-[var(--text-muted)]">{hint}</div>}
    </div>
  )
}

/** Grid of skeleton cards for catalog-style loading */
export function SkeletonCardGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="h-48 w-full" />
      ))}
    </div>
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer min-h-[3rem]', className)} aria-hidden />
}

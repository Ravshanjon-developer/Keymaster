import { Link } from 'react-router-dom'

import { GlassCard } from '@/shared/components/ui'

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  banner,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  banner?: React.ReactNode
}) {
  return (
    <div className="page-mesh mx-auto flex min-h-[min(32rem,calc(100dvh-6rem))] max-w-md flex-col justify-center px-4 py-12 pb-28 lg:pb-12">
      <GlassCard className="overflow-hidden p-0 shadow-lg shadow-brand-900/5 ring-1 ring-[var(--border-default)]">
        <div className="border-b border-[var(--border-default)] bg-gradient-to-br from-brand-50/90 via-[var(--bg-elevated)] to-accent-50/40 px-6 py-6 dark:from-brand-950/50 dark:via-[var(--bg-elevated)] dark:to-accent-950/25">
          <Link
            to="/"
            className="font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-700 hover:text-brand-800 dark:text-brand-300"
          >
            KeyMaster
          </Link>
          <h1 className="font-display mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-[1.65rem]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{subtitle}</p>
          )}
          {banner}
        </div>
        <div className="px-6 py-6">{children}</div>
        {footer && (
          <div className="border-t border-[var(--border-default)] bg-[var(--bg-soft)] px-6 py-4 text-center text-sm text-[var(--text-secondary)] dark:bg-brand-950/20">
            {footer}
          </div>
        )}
      </GlassCard>
    </div>
  )
}

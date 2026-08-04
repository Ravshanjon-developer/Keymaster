import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { displayKey } from '@/shared/lib/hotkeys'
import { cn } from '@/shared/lib/utils'

export function GlassCard({
  children,
  className,
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn('glass rounded-[1.15rem] p-5 md:p-6', className)}
    >
      {children}
    </motion.div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-[var(--bg-muted)]', className)} />
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-lg font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="text-muted max-w-sm text-sm">{description}</p>
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition duration-200',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]',
        'disabled:pointer-events-none disabled:opacity-55',
        'active:translate-y-px active:scale-[0.985]',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-5 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' &&
          'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

type BadgeTone = 'brand' | 'success' | 'neutral' | 'warning' | 'locked'

export function StatusBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'status-chip',
        tone === 'brand' &&
          'border-brand-700/30 bg-brand-700 text-white dark:bg-brand-500 dark:text-ink',
        tone === 'success' &&
          'border-brand-700/25 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200',
        tone === 'neutral' &&
          'border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-secondary)]',
        tone === 'warning' &&
          'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
        tone === 'locked' &&
          'border-[var(--border-default)] bg-[var(--bg-muted)] text-[var(--text-muted)]',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn(
        'h-1.5 overflow-hidden rounded-full bg-[var(--bg-muted)]',
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-out', barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function KeyCap({
  label,
  active,
  learned,
}: {
  label: string
  active?: boolean
  learned?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-b-4 px-3 text-sm font-semibold shadow-sm transition-all duration-150',
        active
          ? 'scale-95 border-brand-500 border-b-brand-700 bg-brand-50 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100'
          : learned
            ? 'border-brand-500/50 border-b-brand-700 bg-brand-50 text-brand-900 dark:bg-brand-950/50 dark:text-brand-100'
            : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]',
      )}
    >
      {label}
    </span>
  )
}

export function KeyCombo({
  keys,
  activeKeys,
  learned,
}: {
  keys: string[]
  activeKeys?: string[]
  learned?: boolean
}) {
  const active = new Set(activeKeys ?? [])
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {keys.map((k, i) => (
        <span key={`${k}-${i}`} className="flex items-center gap-2">
          {i > 0 && <span className="text-[var(--text-muted)]">+</span>}
          <KeyCap label={displayKey(k)} active={active.has(k)} learned={learned} />
        </span>
      ))}
    </div>
  )
}

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
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
      whileHover={hover ? { y: -3, transition: { duration: 0.22 } } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={cn('glass rounded-[var(--radius-card)] p-5 md:p-6', hover && 'cursor-pointer', className)}
      style={hover ? { boxShadow: 'var(--shadow-premium)' } : undefined}
    >
      {children}
    </motion.div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer min-h-[1rem]', className)} aria-hidden />
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string
  description: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center"
      role="status"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-soft)] text-brand-700 dark:text-brand-300"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="text-h3">{title}</p>
        <p className="text-muted text-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'
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
        'disabled:pointer-events-none disabled:opacity-55',
        size === 'sm' && '!min-h-9 px-3 py-1.5 text-xs',
        size === 'md' && 'text-button',
        size === 'lg' && 'min-h-12 px-6 py-3 text-base',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' && 'btn-ghost',
        variant === 'outline' && 'btn-outline',
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
          'border-success-600/25 bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
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
      className={cn('h-2 overflow-hidden rounded-full bg-[var(--bg-muted)]', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full bg-brand-600 transition-[width] duration-500 ease-[var(--ease-out)]',
          barClassName,
        )}
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
        'inline-flex min-h-10 min-w-10 items-center justify-center rounded-[var(--radius-md)] border border-b-4 px-3 text-sm font-semibold transition-[transform,background-color,border-color] duration-150',
        active
          ? 'scale-95 border-brand-500 border-b-brand-700 bg-brand-50 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100'
          : learned
            ? 'border-brand-500/50 border-b-brand-700 bg-brand-50 text-brand-900 dark:bg-brand-950/50 dark:text-brand-100'
            : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]',
      )}
      style={{ boxShadow: 'var(--shadow-sm)' }}
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

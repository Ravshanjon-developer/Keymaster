import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

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
  return <div className={cn('animate-pulse rounded-xl bg-ink/8 dark:bg-slate-700/50', className)} />
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
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
            : 'border-ink/15 bg-white text-ink dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
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
          {i > 0 && <span className="text-slate-400">+</span>}
          <KeyCap label={displayKey(k)} active={active.has(k)} learned={learned} />
        </span>
      ))}
    </div>
  )
}

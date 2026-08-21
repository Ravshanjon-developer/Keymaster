import { keyIdForChar, layoutRows, needsShift, type LayoutId } from '@/features/typing/typingEngine'
import { useT } from '@/shared/i18n'
import { cn } from '@/shared/lib/utils'

type Props = {
  layout: LayoutId
  nextChar: string
  last: { key: string; ok: boolean } | null
  compact?: boolean
}

export function TypingKeyboard({ layout, nextChar, last, compact }: Props) {
  const t = useT()
  const rows = layoutRows(layout)
  const nextId = keyIdForChar(nextChar, layout)
  const shiftOn = needsShift(nextChar, layout)
  const lastId = last ? keyIdForChar(last.key, layout) : null
  const unit = compact ? 26 : 32

  return (
    <div className="mx-auto w-full max-w-[720px] overflow-x-auto" aria-hidden>
      <div className="mx-auto flex w-max flex-col items-center gap-[3px] sm:gap-1">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-stretch gap-[3px] sm:gap-1">
            {row.map((key) => {
              const w = key.width ?? 1
              const size = unit * w + (w - 1) * (compact ? 3 : 4)
              if (key.spacer) {
                return <span key={key.id} style={{ width: size, height: compact ? 28 : 36 }} />
              }
              const isNext = nextId === key.id || ((key.id === 'Shift' || key.id === 'ShiftR') && shiftOn)
              const isError = Boolean(last && !last.ok && lastId === key.id)
              const isOk = Boolean(last && last.ok && lastId === key.id)
              const isSpace = key.id === ' '
              const label = isSpace ? t('typing.space') : key.label
              return (
                <span
                  key={key.id}
                  className={cn(
                    'inline-flex items-center justify-center rounded-[6px] border text-[10px] font-medium sm:text-[11px]',
                    key.id === 'Enter' || key.id === 'Shift' || key.id === 'ShiftR' || key.id === 'Tab' || key.id === 'Caps' || key.id === 'Backspace'
                      ? 'px-1'
                      : 'uppercase',
                    isNext
                      ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-500 dark:text-ink'
                      : isError
                        ? 'border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : isOk
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-[var(--text-primary)]'
                          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-muted)]',
                  )}
                  style={{ width: size, height: compact ? 28 : 36 }}
                >
                  {label}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

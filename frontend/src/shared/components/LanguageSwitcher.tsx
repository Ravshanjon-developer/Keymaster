import { useLocaleStore, useT, type Locale } from '@/shared/i18n'
import { cn } from '@/shared/lib/utils'

export function LanguageSwitcher({
  compact = false,
  variant = 'nav',
}: {
  compact?: boolean
  variant?: 'nav' | 'player'
}) {
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)
  const t = useT()

  const options: { id: Locale; label: string }[] = [
    { id: 'ru', label: t('nav.langRu') },
    { id: 'tg', label: t('nav.langTg') },
  ]

  if (variant === 'player') {
    return (
      <div className="km-player-lang" role="group" aria-label={t('nav.language')}>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLocale(opt.id)}
            className={locale === opt.id ? 'is-on' : undefined}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-ink/10 p-0.5 dark:border-white/15',
        compact ? 'w-full' : '',
      )}
      role="group"
      aria-label={t('nav.language')}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setLocale(opt.id)}
          className={cn(
            'rounded-md font-bold tracking-wide transition',
            compact ? 'min-h-11 flex-1 px-3 text-[13px]' : 'px-2.5 py-1 text-[12px]',
            locale === opt.id
              ? 'bg-brand-700 text-white dark:bg-brand-500 dark:text-ink'
              : 'text-ink/70 hover:text-ink dark:text-slate-300 dark:hover:text-white',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

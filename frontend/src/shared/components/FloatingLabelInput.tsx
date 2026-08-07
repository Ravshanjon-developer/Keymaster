import { cn } from '@/shared/lib/utils'

type FloatingLabelInputProps = {
  id: string
  label: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  required?: boolean
  minLength?: number
  autoComplete?: string
  disabled?: boolean
  onFocus?: () => void
}

export function FloatingLabelInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  required,
  minLength,
  autoComplete,
  disabled,
  onFocus,
}: FloatingLabelInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        disabled={disabled}
        value={value}
        placeholder=" "
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'peer block h-12 w-full rounded-xl border px-3.5 pb-2 pt-5 text-sm outline-none transition',
          'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]',
          'focus:border-brand-600 focus:ring-4 focus:ring-[var(--focus-ring)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'placeholder:text-transparent',
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          'pointer-events-none absolute left-3.5 origin-left transition-all duration-200',
          'top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]',
          'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.85] peer-focus:px-1',
          'peer-focus:bg-[var(--bg-elevated)] peer-focus:font-medium peer-focus:text-brand-700',
          'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-[0.85]',
          'peer-[:not(:placeholder-shown)]:bg-[var(--bg-elevated)] peer-[:not(:placeholder-shown)]:px-1',
          'peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-brand-700',
          'dark:peer-focus:text-brand-300 dark:peer-[:not(:placeholder-shown)]:text-brand-300',
        )}
      >
        {label}
      </label>
    </div>
  )
}

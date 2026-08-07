import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

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
  error?: string
  helperText?: string
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
  error,
  helperText,
}: FloatingLabelInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type
  const invalid = Boolean(error)

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          id={id}
          type={inputType}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          disabled={disabled}
          value={value}
          placeholder=" "
          aria-invalid={invalid}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-hint` : undefined}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'peer block h-12 w-full border px-3.5 pb-2 pt-5 text-sm outline-none',
            'rounded-[var(--radius-input)] border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]',
            'transition-[border-color,box-shadow] duration-[var(--duration-normal)] ease-[var(--ease-out)]',
            'focus:border-brand-600 focus:shadow-[0_0_0_4px_var(--focus-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'placeholder:text-transparent',
            isPassword && 'pr-11',
            invalid && 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_4px_rgb(225_29_72_/_0.25)]',
          )}
        />
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-3.5 origin-left transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
            'top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]',
            'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.85] peer-focus:px-1',
            'peer-focus:bg-[var(--bg-elevated)] peer-focus:font-medium peer-focus:text-brand-700',
            'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-[0.85]',
            'peer-[:not(:placeholder-shown)]:bg-[var(--bg-elevated)] peer-[:not(:placeholder-shown)]:px-1',
            'peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:text-brand-700',
            'dark:peer-focus:text-brand-300 dark:peer-[:not(:placeholder-shown)]:text-brand-300',
            invalid && 'peer-focus:text-[var(--color-danger)] peer-[:not(:placeholder-shown)]:text-[var(--color-danger)]',
          )}
        >
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="btn-ghost absolute right-1 top-1/2 !min-h-0 -translate-y-1/2 p-2 text-[var(--text-muted)]"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-caption text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${id}-hint`} className="text-caption">
          {helperText}
        </p>
      )}
    </div>
  )
}

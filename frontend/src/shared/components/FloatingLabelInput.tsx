import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useMemo, useState } from 'react'

import { cn } from '@/shared/lib/utils'

function passwordStrengthLevel(value: string): 0 | 1 | 2 | 3 | 4 {
  if (!value) return 0
  let score = 0
  if (value.length >= 6) score += 1
  if (value.length >= 10) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1
  return Math.min(4, Math.max(1, score)) as 1 | 2 | 3 | 4
}

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
  success?: boolean
  showPasswordStrength?: boolean
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
  success,
  showPasswordStrength,
}: FloatingLabelInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type
  const invalid = Boolean(error)
  const valid = Boolean(success && value && !invalid)
  const floated = focused || value.length > 0
  const strength = useMemo(
    () => (showPasswordStrength && isPassword ? passwordStrengthLevel(value) : 0),
    [showPasswordStrength, isPassword, value],
  )

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
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-hint` : showPasswordStrength ? `${id}-strength` : undefined
          }
          onFocus={() => {
            setFocused(true)
            onFocus?.()
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'block h-12 w-full border px-3.5 text-sm leading-5 outline-none',
            floated ? 'pb-3 pt-4' : 'py-3.5',
            'rounded-[var(--radius-input)] border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]',
            'transition-[border-color,box-shadow,padding] duration-[var(--duration-normal)] ease-[var(--ease-out)]',
            'focus:border-[var(--color-accent)] focus:shadow-[0_0_0_4px_var(--focus-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'placeholder:text-transparent',
            isPassword && 'pr-11',
            invalid &&
              'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_4px_rgb(225_29_72_/_0.25)]',
            valid &&
              'border-[var(--color-success)] focus:border-[var(--color-success)] focus:shadow-[0_0_0_4px_rgb(22_163_74_/_0.22)]',
          )}
        />
        {valid && !isPassword && (
          <CheckCircle2
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-success)]"
            aria-hidden
          />
        )}
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-3.5 origin-left transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]',
            floated
              ? 'top-0 -translate-y-1/2 scale-[0.85] bg-[var(--bg-elevated)] px-1 font-medium text-brand-700 dark:text-brand-300'
              : 'top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]',
            invalid && floated && 'text-[var(--color-danger)]',
            valid && floated && 'text-[var(--color-success)]',
          )}
        >
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className={cn(
              'btn-ghost absolute right-1 !min-h-0 -translate-y-1/2 p-2 text-[var(--text-muted)]',
              floated ? 'top-[1.625rem]' : 'top-1/2',
            )}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        )}
      </div>
      {showPasswordStrength && isPassword && value.length > 0 && (
        <div
          id={`${id}-strength`}
          className="km-password-strength"
          data-level={strength}
          role="meter"
          aria-valuenow={strength}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label="Password strength"
        >
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
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

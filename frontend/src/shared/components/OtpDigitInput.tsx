import { useRef } from 'react'

const OTP_LENGTH = 6

type OtpDigitInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
}

export function OtpDigitInput({ value, onChange, disabled, id }: OtpDigitInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH)

  function focusIndex(index: number) {
    const i = Math.max(0, Math.min(index, OTP_LENGTH - 1))
    refs.current[i]?.focus()
    refs.current[i]?.select()
  }

  function applyDigits(next: string) {
    onChange(next.replace(/\D/g, '').slice(0, OTP_LENGTH))
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      applyDigits(digits.slice(0, index) + digits.slice(index + 1))
      return
    }
    if (cleaned.length > 1) {
      const merged = (digits.slice(0, index) + cleaned).slice(0, OTP_LENGTH)
      applyDigits(merged)
      focusIndex(Math.min(index + cleaned.length, OTP_LENGTH - 1))
      return
    }
    const char = cleaned[0]
    const slots = digits.split('')
    while (slots.length < OTP_LENGTH) slots.push('')
    slots[index] = char
    applyDigits(slots.join('').slice(0, OTP_LENGTH))
    if (index < OTP_LENGTH - 1) focusIndex(index + 1)
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        applyDigits(digits.slice(0, index) + digits.slice(index + 1))
      } else if (index > 0) {
        applyDigits(digits.slice(0, index - 1) + digits.slice(index))
        focusIndex(index - 1)
      }
      return
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusIndex(index - 1)
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault()
      focusIndex(index + 1)
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted) {
      applyDigits(pasted)
      focusIndex(Math.min(pasted.length, OTP_LENGTH) - 1)
    }
  }

  return (
    <div id={id} className="mt-2 flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`${index + 1} из ${OTP_LENGTH}`}
          maxLength={index === 0 ? OTP_LENGTH : 1}
          disabled={disabled}
          value={digits[index] ?? ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className="h-12 w-10 shrink-0 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-center text-xl font-semibold tabular-nums text-[var(--text-primary)] outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-[var(--focus-ring)] disabled:opacity-50 sm:w-11"
        />
      ))}
    </div>
  )
}

export const otpDigitCount = OTP_LENGTH

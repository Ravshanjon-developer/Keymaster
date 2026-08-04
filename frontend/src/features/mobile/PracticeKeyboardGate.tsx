import { Link } from 'react-router-dom'
import { BookOpen, Brain } from 'lucide-react'

import { KeyboardIllustration } from '@/features/mobile/KeyboardIllustration'
import { usePhysicalKeyboard } from '@/shared/hooks/usePhysicalKeyboard'
import { useT } from '@/shared/i18n'
import { GlassCard } from '@/shared/components/ui'

type Props = {
  children: React.ReactNode
  courseQuery?: string
}

export function PracticeKeyboardGate({ children, courseQuery }: Props) {
  const hasPhysical = usePhysicalKeyboard()
  const t = useT()

  if (hasPhysical) return <>{children}</>

  const reviewTo = courseQuery ? `/review?course=${encodeURIComponent(courseQuery)}` : '/review'
  const quizTo = courseQuery ? `/quiz?course=${encodeURIComponent(courseQuery)}` : '/quiz'

  return (
    <GlassCard className="relative overflow-hidden p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-400/15 blur-3xl"
      />
      <KeyboardIllustration className="mx-auto h-auto w-full max-w-xs" />
      <h2 className="text-page-title mt-6 text-center text-2xl">{t('mobile.keyboardRequiredTitle')}</h2>
      <p className="text-muted mx-auto mt-3 max-w-md text-center">{t('mobile.keyboardRequiredDesc')}</p>
      <p className="mt-4 text-center text-xs text-[var(--text-muted)]">{t('mobile.keyboardHint')}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to={reviewTo} className="btn-primary min-h-11 flex-1 py-3.5 text-base sm:flex-initial sm:px-8">
          <BookOpen className="h-5 w-5" aria-hidden />
          {t('mobile.ctaReview')}
        </Link>
        <Link to={quizTo} className="btn-secondary min-h-11 flex-1 py-3.5 text-base sm:flex-initial sm:px-8">
          <Brain className="h-5 w-5" aria-hidden />
          {t('mobile.ctaQuiz')}
        </Link>
      </div>
    </GlassCard>
  )
}

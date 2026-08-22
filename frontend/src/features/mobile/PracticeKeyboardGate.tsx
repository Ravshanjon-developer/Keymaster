import { Link } from 'react-router-dom'

import { KeyboardIllustration } from '@/features/mobile/KeyboardIllustration'
import { usePhysicalKeyboard } from '@/shared/hooks/usePhysicalKeyboard'
import { useT } from '@/shared/i18n'
import { PageShell } from '@/shared/components/PageLayout'
import { GlassCard } from '@/shared/components/ui'
import { PRACTICE_ICON_STROKE, practiceIcons } from '@/shared/lib/practiceNavIcons'

type Props = {
  children: React.ReactNode
  courseQuery?: string
  /** When true, show the trainer even without a physical keyboard (tap on-screen keys). */
  allowVirtualKeys?: boolean
}

export function PracticeKeyboardGate({ children, courseQuery, allowVirtualKeys }: Props) {
  const hasPhysical = usePhysicalKeyboard()
  const t = useT()
  const ReviewIcon = practiceIcons.review
  const QuizIcon = practiceIcons.quiz

  if (hasPhysical || allowVirtualKeys) return <>{children}</>

  const reviewTo = courseQuery ? `/review?course=${encodeURIComponent(courseQuery)}` : '/review'
  const quizTo =
    courseQuery && courseQuery !== 'computer-basics'
      ? `/quiz?course=${encodeURIComponent(courseQuery)}`
      : '/quiz'

  return (
    <PageShell width="2xl">
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
          <ReviewIcon className="h-5 w-5" strokeWidth={PRACTICE_ICON_STROKE} aria-hidden />
          {t('mobile.ctaReview')}
        </Link>
        <Link to={quizTo} className="btn-secondary min-h-11 flex-1 py-3.5 text-base sm:flex-initial sm:px-8">
          <QuizIcon className="h-5 w-5" strokeWidth={PRACTICE_ICON_STROKE} aria-hidden />
          {t('mobile.ctaQuiz')}
        </Link>
      </div>
    </GlassCard>
    </PageShell>
  )
}

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
  /** Dark lesson-player chrome instead of the light practice shell. */
  variant?: 'page' | 'player'
}

export function PracticeKeyboardGate({
  children,
  courseQuery,
  allowVirtualKeys,
  variant = 'page',
}: Props) {
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

  if (variant === 'player') {
    return (
      <div className="lp-kb-gate">
        <KeyboardIllustration className="lp-kb-gate-art" />
        <h2>{t('mobile.keyboardRequiredTitle')}</h2>
        <p>{t('mobile.keyboardRequiredDesc')}</p>
        <p className="lp-kb-gate-hint">{t('mobile.keyboardHint')}</p>
        <div className="lp-kb-gate-actions">
          <Link to={reviewTo} className="check-btn">
            <ReviewIcon className="h-4 w-4" strokeWidth={PRACTICE_ICON_STROKE} aria-hidden />
            {t('mobile.ctaReview')}
          </Link>
          <Link to={quizTo} className="nav-btn">
            <QuizIcon className="h-4 w-4" strokeWidth={PRACTICE_ICON_STROKE} aria-hidden />
            {t('mobile.ctaQuiz')}
          </Link>
        </div>
      </div>
    )
  }

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

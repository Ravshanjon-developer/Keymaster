import { CheckCircle2, ExternalLink, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useT } from '@/shared/i18n'
import { GlassCard } from '@/shared/components/ui'

type Props = {
  title: string
  actionPrompt: string
  steps: string[]
  simulatorHref?: string
  requiresSimulator?: boolean
  onComplete: () => void
  completed: boolean
}

export function TaskLessonPanel({
  title,
  actionPrompt,
  steps,
  simulatorHref = '/simulator?mode=desktop',
  requiresSimulator = false,
  onComplete,
  completed,
}: Props) {
  const t = useT()

  return (
    <GlassCard className="border-brand-600/20">
      <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{t('lesson.taskMode')}</p>
      <h2 className="mt-2 text-xl font-semibold text-ink dark:text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{actionPrompt}</p>

      <div className="mt-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-muted)] p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
          <ListChecks className="h-4 w-4 text-brand-600" />
          {t('lesson.taskStepsTitle')}
        </p>
        <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {steps.map((step) => (
            <li key={step} className="flex gap-2">
              <span className="text-brand-600">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to={simulatorHref} className="btn-secondary inline-flex flex-1 justify-center gap-2 py-3">
          <ExternalLink className="h-4 w-4" />
          {t('lesson.openDesktopSim')}
        </Link>
        {!requiresSimulator ? (
          <button
            type="button"
            disabled={completed}
            onClick={onComplete}
            className="btn-primary inline-flex flex-1 justify-center gap-2 py-3"
          >
            <CheckCircle2 className="h-4 w-4" />
            {completed ? t('lesson.taskDone') : t('lesson.taskComplete')}
          </button>
        ) : completed ? (
          <span className="btn-primary inline-flex flex-1 cursor-default justify-center gap-2 py-3 opacity-80">
            <CheckCircle2 className="h-4 w-4" />
            {t('lesson.taskDone')}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">
        {requiresSimulator ? t('lesson.taskSimOnly') : t('lesson.taskHonesty')}
      </p>
    </GlassCard>
  )
}

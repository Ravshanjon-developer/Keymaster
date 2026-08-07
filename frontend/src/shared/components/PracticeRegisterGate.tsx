import { Link } from 'react-router-dom'

import { useT } from '@/shared/i18n'
import { GlassCard } from '@/shared/components/ui'

export function PracticeRegisterGate({ returnTo }: { returnTo?: string }) {
  const t = useT()
  const authState = returnTo ? { from: returnTo } : undefined

  return (
    <GlassCard className="border-brand-600/25 bg-gradient-to-br from-brand-50/80 to-[var(--bg-elevated)] dark:from-brand-950/40 dark:to-[var(--bg-elevated)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
        {t('auth.practiceGateEyebrow')}
      </p>
      <h2 className="font-display mt-2 text-lg font-bold tracking-tight text-[var(--text-primary)]">
        {t('auth.practiceGateTitle')}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{t('auth.practiceGateBody')}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link to="/register" state={authState} className="btn-primary flex-1 text-center">
          {t('auth.practiceGateRegister')}
        </Link>
        <Link to="/login" state={authState} className="btn-secondary flex-1 text-center">
          {t('auth.practiceGateLogin')}
        </Link>
      </div>
    </GlassCard>
  )
}

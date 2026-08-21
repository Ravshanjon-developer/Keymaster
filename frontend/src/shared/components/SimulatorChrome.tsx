import { NavLink, useLocation } from 'react-router-dom'

import { useT } from '@/shared/i18n'
import { cn } from '@/shared/lib/utils'

/** Compact VS Code title-bar controls: leave practice + switch Desktop / editor. */
export function VsCodeWorkbenchLinks() {
  const t = useT()
  const { pathname, search } = useLocation()
  const isDesktop = pathname === '/simulator' && search.includes('mode=desktop')

  return (
    <div className="flex shrink-0 items-center gap-1 pr-1">
      <div className="mr-1 flex rounded-[2px] border border-edge bg-surface-2 p-px">
        <NavLink
          to="/simulator?mode=desktop"
          className={cn(
            'rounded-[2px] px-1.5 py-0.5 text-[11px] leading-none transition-colors',
            isDesktop ? 'bg-surface-3 text-ink' : 'text-ink-dim hover:text-ink',
          )}
        >
          {t('practiceShell.desktopSimulator')}
        </NavLink>
        <NavLink
          to="/simulator"
          end
          className={cn(
            'rounded-[2px] px-1.5 py-0.5 text-[11px] leading-none transition-colors',
            !isDesktop ? 'bg-surface-3 text-ink' : 'text-ink-dim hover:text-ink',
          )}
        >
          {t('practiceShell.simulator')}
        </NavLink>
      </div>
      <NavLink
        to="/practice"
        className="rounded-[2px] px-1.5 py-0.5 text-[11px] text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink"
      >
        {t('practiceShell.exitSim')}
      </NavLink>
    </div>
  )
}

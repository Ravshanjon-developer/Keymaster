import { Circle, CircleCheck } from 'lucide-react'

import { PracticeRegisterGate } from '@/shared/components/PracticeRegisterGate'
import { useT } from '@/shared/i18n'
import { cn } from '@/shared/lib/utils'

import type { SystemStudyRow } from './systemStudy'

type Props = {
  rows: SystemStudyRow[]
  currentId: string
  token: boolean
  lessonId: string
  completedAll: boolean
  ticks: Record<string, boolean>
  onToggle: (id: string) => void
  onCompleteAll: () => void
}

export function SystemStudySheet({
  rows,
  currentId,
  token,
  lessonId,
  completedAll,
  ticks,
  onToggle,
  onCompleteAll,
}: Props) {
  const t = useT()
  const allTicked = rows.length > 0 && rows.every((row) => ticks[row.id])

  return (
    <div className="km-system-sheet">
      <div className="km-system-scroll">
        <table className="km-system-table">
          <thead>
            <tr>
              <th>{t('lesson.systemStudyColKey')}</th>
              <th>{t('lesson.systemStudyColDoes')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={cn(row.id === currentId && 'is-current')}>
                <td>
                  <span className="km-system-key">{row.shortcut}</span>
                  <span className="km-system-name">{row.title}</span>
                </td>
                <td>{row.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="lp-do-label">{t('lesson.systemStudyCheckTitle')}</p>
        <ul className="lp-check km-system-check">
          {rows.map((row, index) => (
            <li key={row.id}>
              <button
                type="button"
                className={cn('lp-check-item', ticks[row.id] && 'is-on')}
                onClick={() => onToggle(row.id)}
              >
                {ticks[row.id] ? <CircleCheck /> : <Circle />}
                <span>
                  {index + 1}. {row.shortcut} — {row.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {!token ? (
        <PracticeRegisterGate returnTo={`/lessons/${lessonId}`} />
      ) : (
        <button
          type="button"
          className="check-btn"
          disabled={completedAll || !allTicked}
          onClick={onCompleteAll}
        >
          {completedAll ? t('lesson.systemStudyAllDone') : t('lesson.systemStudyDoneAll')}
        </button>
      )}
    </div>
  )
}
